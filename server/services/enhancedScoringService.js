import { detectFraudPatternsEnhanced } from './enhancedDetectionService.js';
import dayjs from 'dayjs';
import { 
  calculateBetweennessCentrality, 
  calculatePageRank, 
  calculateTransactionVelocity,
  detectPageRankAnomalies 
} from './bonusFeatures.js';
import { calculateMetrics } from './metricsService.js';

/**
 * Enhanced Scoring Service - Optimized for ≥70% precision and ≥60% recall
 * 
 * Key improvements:
 * - Confidence-based scoring
 * - Multi-pattern correlation
 * - Adaptive thresholds
 * - Enhanced false positive filtering
 */

// Pattern weights (adjusted for better precision)
const PATTERN_WEIGHTS = {
  cycle_length_3: 45,
  cycle_length_4: 45,
  cycle_length_5: 45,
  fan_in: 35,
  fan_out: 35,
  layered_shell: 40,
  amount_anomaly: 25,
  rapid_new_account: 30,
  high_activity_density: 25
};

const HIGH_VELOCITY_BONUS = 12;
const MULTI_PATTERN_BONUS = 15; // Bonus for accounts with multiple patterns

/**
 * Enhanced legitimate merchant detection
 */
function isLegitimateMerchantEnhanced(accountId, transactions, graph) {
  const inDegree = graph.inDegree(accountId);
  const outDegree = graph.outDegree(accountId);
  
  // Must have both high in-degree and high out-degree
  if (inDegree < 15 || outDegree < 15) {
    return false;
  }
  
  const accountTransactions = transactions.filter(t => 
    t.sender_id === accountId || t.receiver_id === accountId
  );
  
  if (accountTransactions.length === 0) return false;
  
  accountTransactions.sort((a, b) => 
    new Date(a.timestamp) - new Date(b.timestamp)
  );
  
  const firstTx = new Date(accountTransactions[0].timestamp);
  const lastTx = new Date(accountTransactions[accountTransactions.length - 1].timestamp);
  const timeSpreadDays = dayjs(lastTx).diff(dayjs(firstTx), 'day');
  
  // Check amount diversity (legitimate merchants have diverse amounts)
  const amounts = accountTransactions.map(tx => tx.amount);
  const uniqueAmountRanges = new Set(
    amounts.map(a => Math.floor(a / 100) * 100)
  ).size;
  const amountDiversity = uniqueAmountRanges / amounts.length;
  
  // Check transaction time distribution (legitimate merchants have consistent activity)
  const hourDistribution = new Map();
  accountTransactions.forEach(tx => {
    const hour = new Date(tx.timestamp).getHours();
    hourDistribution.set(hour, (hourDistribution.get(hour) || 0) + 1);
  });
  const activeHours = hourDistribution.size;
  const hourDiversity = activeHours / 24;
  
  // Legitimate merchant criteria:
  // 1. Long time span (≥30 days)
  // 2. High amount diversity (≥0.4)
  // 3. Consistent activity across hours (≥0.3)
  if (timeSpreadDays >= 30 && amountDiversity >= 0.4 && hourDiversity >= 0.3) {
    return true;
  }
  
  // Also check if account has balanced in/out flow (typical of merchants)
  const incomingAmount = accountTransactions
    .filter(tx => tx.receiver_id === accountId)
    .reduce((sum, tx) => sum + tx.amount, 0);
  const outgoingAmount = accountTransactions
    .filter(tx => tx.sender_id === accountId)
    .reduce((sum, tx) => sum + tx.amount, 0);
  
  const balanceRatio = Math.min(incomingAmount, outgoingAmount) / 
    Math.max(incomingAmount, outgoingAmount);
  
  // Balanced flow suggests merchant
  if (balanceRatio > 0.6 && timeSpreadDays >= 20) {
    return true;
  }
  
  return false;
}

/**
 * Calculate confidence score based on pattern confidence and correlation
 */
function calculateConfidenceScore(account, graph) {
  let confidence = 0;
  let patternCount = account.detected_patterns.length;
  
  // Base confidence from pattern confidences
  if (account.pattern_confidence) {
    const confidences = Object.values(account.pattern_confidence);
    if (confidences.length > 0) {
      confidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;
    }
  }
  
  // Multi-pattern bonus (accounts with multiple patterns are more suspicious)
  if (patternCount >= 2) {
    confidence += 0.15 * (patternCount - 1);
  }
  
  // High degree correlation (money mules often have specific degree patterns)
  const inDegree = account.in_degree;
  const outDegree = account.out_degree;
  const totalDegree = inDegree + outDegree;
  
  // Suspicious: High in-degree but low out-degree (collector)
  if (inDegree > 10 && outDegree < 5) {
    confidence += 0.1;
  }
  
  // Suspicious: High out-degree but low in-degree (distributor)
  if (outDegree > 10 && inDegree < 5) {
    confidence += 0.1;
  }
  
  // Suspicious: Balanced but high total (intermediary)
  if (totalDegree > 15 && Math.abs(inDegree - outDegree) < 3) {
    confidence += 0.05;
  }
  
  return Math.min(1.0, confidence);
}

/**
 * Calculate enhanced suspicion score
 */
function calculateSuspicionScoreEnhanced(account, transactions, graph) {
  let score = 0;
  
  // Add pattern scores weighted by confidence
  account.detected_patterns.forEach(pattern => {
    const weight = PATTERN_WEIGHTS[pattern] || 0;
    const confidence = account.pattern_confidence?.[pattern] || 0.7;
    score += weight * confidence;
  });
  
  // Multi-pattern bonus
  if (account.detected_patterns.length >= 2) {
    score += MULTI_PATTERN_BONUS;
  }
  
  // Add velocity bonus
  const velocityScores = calculateTransactionVelocity(transactions);
  const velocity = velocityScores.get(account.account_id) || 0;
  if (velocity > 70) {
    score += HIGH_VELOCITY_BONUS;
  } else if (velocity > 50) {
    score += HIGH_VELOCITY_BONUS * 0.5;
  }
  
  // Apply false positive reduction
  if (isLegitimateMerchantEnhanced(account.account_id, transactions, graph)) {
    score = score * 0.3; // More aggressive reduction
  }
  
  // Cap at 100
  return Math.min(100, Math.round(score * 10) / 10);
}

/**
 * Filter accounts based on confidence and score thresholds
 * This is key to achieving ≥70% precision
 */
function filterLowConfidenceAccounts(scoredAccounts, minScore = 50) {
  return scoredAccounts.filter(account => {
    // Must have minimum score
    if (account.suspicion_score < minScore) {
      return false;
    }
    
    // Must have at least one high-confidence pattern OR multiple patterns
    const hasHighConfidencePattern = account.detected_patterns.some(pattern => {
      const conf = account.pattern_confidence?.[pattern] || 0.7;
      return conf >= 0.75;
    });
    
    const hasMultiplePatterns = account.detected_patterns.length >= 2;
    
    if (!hasHighConfidencePattern && !hasMultiplePatterns) {
      return false;
    }
    
    // Additional filter: if score is borderline, require high confidence
    if (account.suspicion_score < 65 && account.confidence_score < 0.7) {
      return false;
    }
    
    return true;
  });
}

/**
 * Main enhanced scoring function
 */
export function scoreSuspiciousAccountsEnhanced(detectionResults, transactions) {
  const { suspiciousAccounts, fraudRings, graph } = detectionResults;
  
  // Calculate bonus features
  const betweennessCentrality = calculateBetweennessCentrality(graph);
  const pageRankScores = calculatePageRank(graph);
  const velocityScores = calculateTransactionVelocity(transactions);
  const pageRankAnomalies = detectPageRankAnomalies(graph, pageRankScores);
  
  // Score suspicious accounts
  const scoredAccounts = suspiciousAccounts.map(account => {
    // Calculate confidence score
    let confidence_score = calculateConfidenceScore(account, graph);
    
    // Calculate suspicion score
    let suspicion_score = calculateSuspicionScoreEnhanced(
      account, 
      transactions, 
      graph
    );
    
    // Add bonus feature adjustments
    const betweenness = betweennessCentrality.get(account.account_id) || 0;
    const pageRank = pageRankScores.get(account.account_id) || 0;
    const velocity = velocityScores.get(account.account_id) || 0;
    
    // Boost score for high betweenness (critical bridge nodes)
    if (betweenness > 75) {
      suspicion_score += 8;
      confidence_score += 0.1;
    } else if (betweenness > 60) {
      suspicion_score += 4;
    }
    
    // Boost score for PageRank anomalies
    const isAnomaly = pageRankAnomalies.some(a => a.account_id === account.account_id);
    if (isAnomaly) {
      suspicion_score += 10;
      confidence_score += 0.15;
    }
    
    // Velocity bonus (already partially included)
    if (velocity > 85) {
      suspicion_score += 5;
    }
    
    // Cap scores
    suspicion_score = Math.min(100, suspicion_score);
    const finalConfidence = Math.min(1.0, confidence_score);
    
    return {
      ...account,
      suspicion_score: Math.round(suspicion_score * 10) / 10,
      confidence_score: Math.round(finalConfidence * 100) / 100,
      betweenness_centrality: Math.round(betweenness * 10) / 10,
      pagerank_score: Math.round(pageRank * 10) / 10,
      transaction_velocity: Math.round(velocity * 10) / 10
    };
  });
  
  // Sort by suspicion score descending
  scoredAccounts.sort((a, b) => {
    // Primary sort: suspicion score
    if (Math.abs(a.suspicion_score - b.suspicion_score) > 1) {
      return b.suspicion_score - a.suspicion_score;
    }
    // Secondary sort: confidence score
    return (b.confidence_score || 0) - (a.confidence_score || 0);
  });
  
  // Filter low-confidence accounts to improve precision
  // Use adaptive threshold based on distribution
  const scores = scoredAccounts.map(a => a.suspicion_score);
  const medianScore = scores.length > 0 
    ? scores[Math.floor(scores.length / 2)] 
    : 50;
  
  // Adaptive minimum score: median or 50, whichever is higher
  const adaptiveMinScore = Math.max(50, Math.min(medianScore, 60));
  
  const filteredAccounts = filterLowConfidenceAccounts(
    scoredAccounts, 
    adaptiveMinScore
  );
  
  // Calculate estimated metrics
  const metrics = calculateMetrics(filteredAccounts);
  
  // Score fraud rings
  const scoredRings = fraudRings.map(ring => {
    const memberScores = ring.member_accounts.map(accountId => {
      const account = filteredAccounts.find(a => a.account_id === accountId);
      return account?.suspicion_score || 0;
    });
    
    const avgScore = memberScores.length > 0
      ? memberScores.reduce((a, b) => a + b, 0) / memberScores.length
      : 0;
    
    const maxScore = memberScores.length > 0
      ? Math.max(...memberScores)
      : 0;
    
    // Ring risk score: weighted average of member scores
    const risk_score = avgScore * 0.7 + maxScore * 0.3;
    
    return {
      ...ring,
      risk_score: Math.min(100, Math.round(risk_score * 10) / 10)
    };
  });
  
  scoredRings.sort((a, b) => b.risk_score - a.risk_score);
  
  return {
    suspiciousAccounts: filteredAccounts,
    fraudRings: scoredRings,
    graph,
    processingTime: detectionResults.processingTime,
    metrics: {
      ...metrics,
      accountsFiltered: scoredAccounts.length - filteredAccounts.length,
      filterRate: scoredAccounts.length > 0
        ? ((scoredAccounts.length - filteredAccounts.length) / scoredAccounts.length * 100).toFixed(2)
        : 0
    },
    bonusFeatures: {
      betweenness_centrality_computed: true,
      pagerank_computed: true,
      transaction_velocity_computed: true,
      pagerank_anomalies_detected: pageRankAnomalies.length
    }
  };
}
