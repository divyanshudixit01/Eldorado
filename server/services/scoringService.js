import { detectFraudPatterns } from './detectionService.js';
import dayjs from 'dayjs';
import { 
  calculateBetweennessCentrality, 
  calculatePageRank, 
  calculateTransactionVelocity,
  detectPageRankAnomalies 
} from './bonusFeatures.js';

/**
 * Scoring Service - Implements weighted suspicion scoring with false positive control
 */

// Pattern weights
const PATTERN_WEIGHTS = {
  cycle_length_3: 40,
  cycle_length_4: 40,
  cycle_length_5: 40,
  fan_in: 30,
  fan_out: 30,
  layered_shell: 35
};

const HIGH_VELOCITY_BONUS = 10;

/**
 * Calculate transaction velocity score
 * High velocity = many transactions in short time window
 */
function calculateVelocityScore(accountId, transactions, graph) {
  const accountTransactions = transactions.filter(t => 
    t.sender_id === accountId || t.receiver_id === accountId
  );
  
  if (accountTransactions.length < 5) return 0;
  
  // Sort by timestamp
  accountTransactions.sort((a, b) => 
    new Date(a.timestamp) - new Date(b.timestamp)
  );
  
  // Check transactions in 24-hour windows
  const timeWindow = 24 * 60 * 60 * 1000; // 24 hours
  let maxTransactionsInWindow = 0;
  
  for (let i = 0; i < accountTransactions.length; i++) {
    const windowStart = new Date(accountTransactions[i].timestamp).getTime();
    const windowEnd = windowStart + timeWindow;
    
    let count = 0;
    for (let j = i; j < accountTransactions.length; j++) {
      const txTime = new Date(accountTransactions[j].timestamp).getTime();
      if (txTime <= windowEnd) {
        count++;
      } else {
        break;
      }
    }
    
    maxTransactionsInWindow = Math.max(maxTransactionsInWindow, count);
  }
  
  // High velocity if >= 20 transactions in 24 hours
  if (maxTransactionsInWindow >= 20) {
    return HIGH_VELOCITY_BONUS;
  }
  
  return 0;
}

/**
 * Check if account is a legitimate high-volume merchant (false positive control)
 */
function isLegitimateMerchant(accountId, transactions, graph) {
  const inDegree = graph.inDegree(accountId);
  const outDegree = graph.outDegree(accountId);
  
  // Must have both high in-degree and high out-degree
  if (inDegree < 10 || outDegree < 10) {
    return false;
  }
  
  // Get all transactions involving this account
  const accountTransactions = transactions.filter(t => 
    t.sender_id === accountId || t.receiver_id === accountId
  );
  
  if (accountTransactions.length === 0) return false;
  
  // Sort by timestamp
  accountTransactions.sort((a, b) => 
    new Date(a.timestamp) - new Date(b.timestamp)
  );
  
  // Check time spread
  const firstTx = new Date(accountTransactions[0].timestamp);
  const lastTx = new Date(accountTransactions[accountTransactions.length - 1].timestamp);
  const timeSpreadDays = dayjs(lastTx).diff(dayjs(firstTx), 'day');
  
  // Legitimate if transactions spread across >= 30 days
  if (timeSpreadDays >= 30) {
    return true;
  }
  
  return false;
}

/**
 * Calculate suspicion score for an account
 */
function calculateSuspicionScore(account, transactions, graph) {
  let score = 0;
  
  // Add pattern scores
  account.detected_patterns.forEach(pattern => {
    const weight = PATTERN_WEIGHTS[pattern] || 0;
    score += weight;
  });
  
  // Add velocity bonus
  const velocityScore = calculateVelocityScore(
    account.account_id, 
    transactions, 
    graph
  );
  score += velocityScore;
  
  // Apply false positive reduction
  if (isLegitimateMerchant(account.account_id, transactions, graph)) {
    // Reduce score by 50% for legitimate merchants
    score = score * 0.5;
  }
  
  // Cap at 100
  return Math.min(100, Math.round(score * 10) / 10);
}

/**
 * Calculate risk score for a fraud ring
 */
function calculateRingRiskScore(ring, transactions, graph) {
  let totalScore = 0;
  let memberCount = 0;
  
  ring.member_accounts.forEach(accountId => {
    const inDegree = graph.inDegree(accountId);
    const outDegree = graph.outDegree(accountId);
    
    // Base score from member activity
    const memberScore = (inDegree + outDegree) * 2;
    totalScore += memberScore;
    memberCount++;
  });
  
  // Average score with pattern multiplier
  let avgScore = memberCount > 0 ? totalScore / memberCount : 0;
  
  // Pattern multipliers
  const patternMultipliers = {
    cycle: 1.2,
    fan_in: 1.1,
    fan_out: 1.1,
    layered_shell: 1.15
  };
  
  avgScore *= (patternMultipliers[ring.pattern_type] || 1.0);
  
  // Cap at 100
  return Math.min(100, Math.round(avgScore * 10) / 10);
}

/**
 * Main scoring function - processes detection results and adds scores
 * Includes bonus features: betweenness centrality, PageRank, transaction velocity
 */
export function scoreSuspiciousAccounts(detectionResults, transactions) {
  const { suspiciousAccounts, fraudRings, graph } = detectionResults;
  
  // Calculate bonus features
  const betweennessCentrality = calculateBetweennessCentrality(graph);
  const pageRankScores = calculatePageRank(graph);
  const velocityScores = calculateTransactionVelocity(transactions);
  const pageRankAnomalies = detectPageRankAnomalies(graph, pageRankScores);
  
  // Score suspicious accounts
  const scoredAccounts = suspiciousAccounts.map(account => {
    let suspicion_score = calculateSuspicionScore(
      account, 
      transactions, 
      graph
    );
    
    // Add bonus feature adjustments
    const betweenness = betweennessCentrality.get(account.account_id) || 0;
    const pageRank = pageRankScores.get(account.account_id) || 0;
    const velocity = velocityScores.get(account.account_id) || 0;
    
    // Boost score for high betweenness (critical bridge nodes)
    if (betweenness > 70) {
      suspicion_score += 5;
    }
    
    // Boost score for PageRank anomalies
    const isAnomaly = pageRankAnomalies.some(a => a.account_id === account.account_id);
    if (isAnomaly) {
      suspicion_score += 8;
    }
    
    // Velocity already included in calculateSuspicionScore, but add extra if very high
    if (velocity > 80) {
      suspicion_score += 5;
    }
    
    // Cap at 100
    suspicion_score = Math.min(100, suspicion_score);
    
    return {
      ...account,
      suspicion_score: Math.round(suspicion_score * 10) / 10,
      betweenness_centrality: Math.round(betweenness * 10) / 10,
      pagerank_score: Math.round(pageRank * 10) / 10,
      transaction_velocity: Math.round(velocity * 10) / 10
    };
  });
  
  // Sort by suspicion score descending
  scoredAccounts.sort((a, b) => b.suspicion_score - a.suspicion_score);
  
  // Score fraud rings
  const scoredRings = fraudRings.map(ring => {
    const risk_score = calculateRingRiskScore(ring, transactions, graph);
    return {
      ...ring,
      risk_score
    };
  });
  
  // Sort rings by risk score descending
  scoredRings.sort((a, b) => b.risk_score - a.risk_score);
  
  return {
    suspiciousAccounts: scoredAccounts,
    fraudRings: scoredRings,
    graph,
    processingTime: detectionResults.processingTime,
    bonusFeatures: {
      betweenness_centrality_computed: true,
      pagerank_computed: true,
      transaction_velocity_computed: true,
      pagerank_anomalies_detected: pageRankAnomalies.length
    }
  };
}
