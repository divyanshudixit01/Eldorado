/**
 * Metrics Service - Tracks precision, recall, and other performance metrics
 */

/**
 * Calculate precision, recall, F1 score, and other metrics
 * @param {Array} detectedAccounts - Accounts flagged by the system
 * @param {Array} groundTruth - Known fraudulent accounts (if available)
 * @param {Array} allAccounts - All accounts in the dataset
 */
export function calculateMetrics(detectedAccounts, groundTruth = [], allAccounts = []) {
  if (!groundTruth || groundTruth.length === 0) {
    // If no ground truth, return estimated metrics based on scoring thresholds
    return estimateMetricsFromScores(detectedAccounts);
  }

  const detectedSet = new Set(detectedAccounts.map(acc => acc.account_id));
  const truthSet = new Set(groundTruth);

  // True Positives: Accounts correctly flagged as fraudulent
  const truePositives = groundTruth.filter(acc => detectedSet.has(acc)).length;

  // False Positives: Accounts incorrectly flagged as fraudulent
  const falsePositives = detectedAccounts.filter(acc => !truthSet.has(acc.account_id)).length;

  // False Negatives: Fraudulent accounts that were not detected
  const falseNegatives = groundTruth.filter(acc => !detectedSet.has(acc)).length;

  // True Negatives: Legitimate accounts correctly not flagged
  const allAccountsSet = new Set(allAccounts);
  const trueNegatives = allAccounts.filter(
    acc => !detectedSet.has(acc) && !truthSet.has(acc)
  ).length;

  // Calculate metrics
  const precision = truePositives + falsePositives > 0
    ? truePositives / (truePositives + falsePositives)
    : 0;

  const recall = truePositives + falseNegatives > 0
    ? truePositives / (truePositives + falseNegatives)
    : 0;

  const f1Score = precision + recall > 0
    ? (2 * precision * recall) / (precision + recall)
    : 0;

  const accuracy = truePositives + falsePositives + trueNegatives + falseNegatives > 0
    ? (truePositives + trueNegatives) / (truePositives + falsePositives + trueNegatives + falseNegatives)
    : 0;

  return {
    precision: Math.round(precision * 10000) / 100, // Percentage
    recall: Math.round(recall * 10000) / 100,
    f1Score: Math.round(f1Score * 10000) / 100,
    accuracy: Math.round(accuracy * 10000) / 100,
    truePositives,
    falsePositives,
    falseNegatives,
    trueNegatives,
    totalDetected: detectedAccounts.length,
    totalFraudulent: groundTruth.length
  };
}

/**
 * Estimate metrics when ground truth is not available
 * Uses scoring thresholds and pattern confidence
 */
function estimateMetricsFromScores(detectedAccounts) {
  if (detectedAccounts.length === 0) {
    return {
      precision: 0,
      recall: 0,
      f1Score: 0,
      accuracy: 0,
      estimated: true
    };
  }

  // Estimate precision based on score distribution
  const highConfidence = detectedAccounts.filter(acc => acc.suspicion_score >= 70).length;
  const mediumConfidence = detectedAccounts.filter(
    acc => acc.suspicion_score >= 50 && acc.suspicion_score < 70
  ).length;
  const lowConfidence = detectedAccounts.filter(acc => acc.suspicion_score < 50).length;

  // Weighted precision estimate
  const estimatedPrecision = (
    highConfidence * 0.85 + // High confidence: ~85% precision
    mediumConfidence * 0.65 + // Medium: ~65% precision
    lowConfidence * 0.40 // Low: ~40% precision
  ) / detectedAccounts.length;

  // Estimate recall (conservative estimate)
  // Assumes we're catching 60-70% of actual fraud
  const estimatedRecall = Math.min(0.70, detectedAccounts.length / Math.max(100, detectedAccounts.length * 1.5));

  const estimatedF1 = estimatedPrecision + estimatedRecall > 0
    ? (2 * estimatedPrecision * estimatedRecall) / (estimatedPrecision + estimatedRecall)
    : 0;

  return {
    precision: Math.round(estimatedPrecision * 10000) / 100,
    recall: Math.round(estimatedRecall * 10000) / 100,
    f1Score: Math.round(estimatedF1 * 10000) / 100,
    accuracy: 0,
    estimated: true,
    highConfidenceCount: highConfidence,
    mediumConfidenceCount: mediumConfidence,
    lowConfidenceCount: lowConfidence
  };
}

/**
 * Calculate confusion matrix
 */
export function calculateConfusionMatrix(detectedAccounts, groundTruth, allAccounts) {
  const metrics = calculateMetrics(detectedAccounts, groundTruth, allAccounts);
  
  return {
    confusionMatrix: {
      truePositives: metrics.truePositives,
      falsePositives: metrics.falsePositives,
      falseNegatives: metrics.falseNegatives,
      trueNegatives: metrics.trueNegatives
    },
    metrics
  };
}
