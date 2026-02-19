import dayjs from 'dayjs';
import { buildTransactionGraph, getAllAccountIds } from './graphBuilder.js';

/**
 * Enhanced Detection Service - Optimized for ≥70% precision and ≥60% recall
 * 
 * Key improvements:
 * - Amount-based anomaly detection
 * - Account lifecycle analysis
 * - Multi-pattern correlation
 * - Adaptive thresholds
 * - Better false positive filtering
 */

/**
 * Detect amount clustering - suspicious round numbers or repeated amounts
 */
function detectAmountAnomalies(transactions, graph) {
  const accountAmounts = new Map();
  const anomalies = [];
  
  // Group transactions by account
  transactions.forEach(tx => {
    [tx.sender_id, tx.receiver_id].forEach(accountId => {
      if (!accountAmounts.has(accountId)) {
        accountAmounts.set(accountId, []);
      }
      accountAmounts.get(accountId).push(tx.amount);
    });
  });
  
  accountAmounts.forEach((amounts, accountId) => {
    if (amounts.length < 5) return;
    
    // Check for round numbers (multiples of 100, 1000, etc.)
    const roundNumbers = amounts.filter(amt => 
      amt % 100 === 0 || amt % 1000 === 0
    ).length;
    const roundRatio = roundNumbers / amounts.length;
    
    // Check for repeated amounts (same amount multiple times)
    const amountFreq = new Map();
    amounts.forEach(amt => {
      amountFreq.set(amt, (amountFreq.get(amt) || 0) + 1);
    });
    const maxRepeat = Math.max(...Array.from(amountFreq.values()));
    const repeatRatio = maxRepeat / amounts.length;
    
    // Check for amount clustering (many transactions with similar amounts)
    const sortedAmounts = [...amounts].sort((a, b) => a - b);
    let clusters = 0;
    for (let i = 1; i < sortedAmounts.length; i++) {
      const diff = Math.abs(sortedAmounts[i] - sortedAmounts[i - 1]);
      const avgAmount = (sortedAmounts[i] + sortedAmounts[i - 1]) / 2;
      if (diff / avgAmount < 0.05) { // Within 5% of each other
        clusters++;
      }
    }
    const clusterRatio = clusters / amounts.length;
    
    // Flag if multiple suspicious patterns
    if ((roundRatio > 0.6 && amounts.length >= 10) || 
        (repeatRatio > 0.3 && amounts.length >= 5) ||
        (clusterRatio > 0.4 && amounts.length >= 10)) {
      anomalies.push({
        account_id: accountId,
        pattern_type: 'amount_anomaly',
        round_ratio: roundRatio,
        repeat_ratio: repeatRatio,
        cluster_ratio: clusterRatio
      });
    }
  });
  
  return anomalies;
}

/**
 * Analyze account lifecycle - detect rapid creation and activity patterns
 */
function analyzeAccountLifecycle(transactions, graph) {
  const accountFirstTx = new Map();
  const accountActivity = new Map();
  
  // Find first transaction for each account
  transactions.forEach(tx => {
    [tx.sender_id, tx.receiver_id].forEach(accountId => {
      if (!accountFirstTx.has(accountId)) {
        accountFirstTx.set(accountId, new Date(tx.timestamp));
        accountActivity.set(accountId, []);
      }
      accountActivity.get(accountId).push(new Date(tx.timestamp));
    });
  });
  
  const suspiciousAccounts = [];
  const allTxTimes = transactions.map(t => new Date(t.timestamp)).sort((a, b) => a - b);
  const datasetStart = allTxTimes[0];
  const datasetEnd = allTxTimes[allTxTimes.length - 1];
  const datasetSpanDays = dayjs(datasetEnd).diff(dayjs(datasetStart), 'day');
  
  accountFirstTx.forEach((firstTx, accountId) => {
    const accountTxs = accountActivity.get(accountId);
    const accountSpanDays = dayjs(accountTxs[accountTxs.length - 1])
      .diff(dayjs(firstTx), 'day');
    
    // Rapid activity after creation (suspicious)
    const daysSinceCreation = dayjs(firstTx).diff(dayjs(datasetStart), 'day');
    const transactionsInFirstWeek = accountTxs.filter(tx => 
      dayjs(tx).diff(dayjs(firstTx), 'day') <= 7
    ).length;
    
    // High activity in short span
    const activityDensity = accountTxs.length / Math.max(1, accountSpanDays);
    
    // New account with high activity
    if (daysSinceCreation < 7 && transactionsInFirstWeek >= 10) {
      suspiciousAccounts.push({
        account_id: accountId,
        pattern_type: 'rapid_new_account',
        days_since_creation: daysSinceCreation,
        transactions_in_first_week: transactionsInFirstWeek
      });
    }
    
    // High activity density
    if (activityDensity > 5 && accountTxs.length >= 20) {
      suspiciousAccounts.push({
        account_id: accountId,
        pattern_type: 'high_activity_density',
        activity_density: activityDensity,
        total_transactions: accountTxs.length
      });
    }
  });
  
  return suspiciousAccounts;
}

/**
 * Enhanced cycle detection with amount validation
 * Filters out legitimate circular payments
 */
function detectCyclesEnhanced(graph, transactions) {
  const cycles = [];
  const ringIdMap = new Map();
  const cycleSet = new Set();
  let ringCounter = 0;
  
  // Build transaction map for amount analysis
  const txMap = new Map();
  transactions.forEach(tx => {
    const key = `${tx.sender_id}_${tx.receiver_id}`;
    if (!txMap.has(key)) {
      txMap.set(key, []);
    }
    txMap.get(key).push(tx);
  });
  
  const dfs = (node, path, startNode, visited) => {
    if (path.length > 5) return;
    
    if (node !== startNode) {
      visited.add(node);
    }
    path.push(node);
    
    if (path.length >= 3 && path.length <= 5) {
      const neighbors = graph.outNeighbors(node);
      if (neighbors.includes(startNode)) {
        const cycle = [...path, startNode];
        const cycleKey = [...new Set(cycle)].sort().join('->');
        
        if (!cycleSet.has(cycleKey)) {
          // Validate cycle with amount analysis
          let totalAmount = 0;
          let isValidCycle = true;
          
          for (let i = 0; i < cycle.length - 1; i++) {
            const from = cycle[i];
            const to = cycle[i + 1];
            const edgeKey = `${from}_${to}`;
            const txs = txMap.get(edgeKey) || [];
            
            if (txs.length === 0) {
              isValidCycle = false;
              break;
            }
            
            // Sum amounts for this edge
            const edgeAmount = txs.reduce((sum, tx) => sum + tx.amount, 0);
            totalAmount += edgeAmount;
          }
          
          // Filter cycles with very similar amounts (likely legitimate refunds)
          // Keep cycles with varying amounts (more suspicious)
          const amounts = [];
          for (let i = 0; i < cycle.length - 1; i++) {
            const from = cycle[i];
            const to = cycle[i + 1];
            const edgeKey = `${from}_${to}`;
            const txs = txMap.get(edgeKey) || [];
            if (txs.length > 0) {
              const edgeAmount = txs.reduce((sum, tx) => sum + tx.amount, 0);
              amounts.push(edgeAmount);
            }
          }
          
          // Check amount variance
          if (amounts.length > 1) {
            const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
            const variance = amounts.reduce((sum, amt) => 
              sum + Math.pow(amt - avgAmount, 2), 0) / amounts.length;
            const stdDev = Math.sqrt(variance);
            const coefficientOfVariation = avgAmount > 0 ? stdDev / avgAmount : 0;
            
            // Low variance suggests refund pattern (filter out)
            // High variance suggests money muling (keep)
            if (coefficientOfVariation < 0.1 && amounts.length >= 3) {
              isValidCycle = false; // Likely legitimate refund cycle
            }
          }
          
          if (isValidCycle) {
            cycleSet.add(cycleKey);
            const ringId = `RING_${String(ringCounter++).padStart(3, '0')}`;
            
            cycle.forEach(accountId => {
              ringIdMap.set(accountId, ringId);
            });
            
            cycles.push({
              accounts: cycle,
              length: cycle.length - 1,
              ring_id: ringId,
              pattern_type: `cycle_length_${cycle.length - 1}`,
              total_amount: totalAmount,
              amount_variance: amounts.length > 1 ? 
                amounts.reduce((sum, amt) => {
                  const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
                  return sum + Math.pow(amt - avg, 2);
                }, 0) / amounts.length : 0
            });
          }
        }
      }
    }
    
    if (path.length < 5) {
      const neighbors = graph.outNeighbors(node);
      neighbors.forEach(neighbor => {
        if (!visited.has(neighbor) || neighbor === startNode) {
          dfs(neighbor, [...path], startNode, visited);
        }
      });
    }
    
    if (node !== startNode) {
      visited.delete(node);
    }
    path.pop();
  };
  
  graph.forEachNode((node) => {
    const visited = new Set();
    dfs(node, [], node, visited);
  });
  
  return { cycles, ringIdMap };
}

/**
 * Enhanced fan-in detection with better filtering
 */
function detectFanInEnhanced(graph, transactions) {
  const fanInAccounts = [];
  const timeWindow = 48 * 60 * 60 * 1000; // Reduced to 48 hours for better precision
  
  graph.forEachNode((node) => {
    const inDegree = graph.inDegree(node);
    
    // Increased threshold to 15 for better precision
    if (inDegree >= 15) {
      const incomingTransactions = transactions.filter(t => 
        t.receiver_id === node
      );
      
      // Group by sliding time windows
      incomingTransactions.sort((a, b) => 
        new Date(a.timestamp) - new Date(b.timestamp)
      );
      
      // Use sliding window instead of fixed windows
      for (let i = 0; i < incomingTransactions.length; i++) {
        const windowStart = new Date(incomingTransactions[i].timestamp).getTime();
        const windowEnd = windowStart + timeWindow;
        
        const sendersInWindow = new Set();
        let txCount = 0;
        
        for (let j = i; j < incomingTransactions.length; j++) {
          const txTime = new Date(incomingTransactions[j].timestamp).getTime();
          if (txTime <= windowEnd) {
            sendersInWindow.add(incomingTransactions[j].sender_id);
            txCount++;
          } else {
            break;
          }
        }
        
        // Require both high unique senders AND high transaction count
        if (sendersInWindow.size >= 15 && txCount >= 20) {
          // Check amount diversity (legitimate merchants have diverse amounts)
          const amounts = incomingTransactions.slice(i, i + txCount)
            .map(tx => tx.amount);
          const uniqueAmounts = new Set(amounts.map(a => Math.round(a / 100) * 100)).size;
          const amountDiversity = uniqueAmounts / amounts.length;
          
          // Low diversity suggests money muling (similar amounts)
          // High diversity suggests legitimate merchant
          if (amountDiversity < 0.3) {
            fanInAccounts.push({
              account_id: node,
              pattern_type: 'fan_in',
              unique_senders: sendersInWindow.size,
              transaction_count: txCount,
              amount_diversity: amountDiversity
            });
            break;
          }
        }
      }
    }
  });
  
  return fanInAccounts;
}

/**
 * Enhanced fan-out detection with better filtering
 */
function detectFanOutEnhanced(graph, transactions) {
  const fanOutAccounts = [];
  const timeWindow = 48 * 60 * 60 * 1000; // Reduced to 48 hours
  
  graph.forEachNode((node) => {
    const outDegree = graph.outDegree(node);
    
    // Increased threshold to 15
    if (outDegree >= 15) {
      const outgoingTransactions = transactions.filter(t => 
        t.sender_id === node
      );
      
      outgoingTransactions.sort((a, b) => 
        new Date(a.timestamp) - new Date(b.timestamp)
      );
      
      // Sliding window approach
      for (let i = 0; i < outgoingTransactions.length; i++) {
        const windowStart = new Date(outgoingTransactions[i].timestamp).getTime();
        const windowEnd = windowStart + timeWindow;
        
        const receiversInWindow = new Set();
        let txCount = 0;
        
        for (let j = i; j < outgoingTransactions.length; j++) {
          const txTime = new Date(outgoingTransactions[j].timestamp).getTime();
          if (txTime <= windowEnd) {
            receiversInWindow.add(outgoingTransactions[j].receiver_id);
            txCount++;
          } else {
            break;
          }
        }
        
        if (receiversInWindow.size >= 15 && txCount >= 20) {
          // Check amount diversity
          const amounts = outgoingTransactions.slice(i, i + txCount)
            .map(tx => tx.amount);
          const uniqueAmounts = new Set(amounts.map(a => Math.round(a / 100) * 100)).size;
          const amountDiversity = uniqueAmounts / amounts.length;
          
          if (amountDiversity < 0.3) {
            fanOutAccounts.push({
              account_id: node,
              pattern_type: 'fan_out',
              unique_receivers: receiversInWindow.size,
              transaction_count: txCount,
              amount_diversity: amountDiversity
            });
            break;
          }
        }
      }
    }
  });
  
  return fanOutAccounts;
}

/**
 * Enhanced layered shell detection
 */
function detectLayeredShellEnhanced(graph, transactions) {
  const layeredShells = [];
  const visitedPaths = new Set();
  
  // Build transaction map
  const txMap = new Map();
  transactions.forEach(tx => {
    const key = `${tx.sender_id}_${tx.receiver_id}`;
    if (!txMap.has(key)) {
      txMap.set(key, []);
    }
    txMap.get(key).push(tx);
  });
  
  const findPaths = (startNode, currentPath, targetLength) => {
    if (currentPath.length === targetLength) {
      const pathKey = currentPath.join('->');
      if (!visitedPaths.has(pathKey)) {
        visitedPaths.add(pathKey);
        
        const intermediateNodes = currentPath.slice(1, -1);
        let isValidShell = true;
        let totalAmount = 0;
        
        for (const node of intermediateNodes) {
          const totalTransactions = graph.inDegree(node) + graph.outDegree(node);
          if (totalTransactions > 3) {
            isValidShell = false;
            break;
          }
        }
        
        // Additional validation: check if amounts are similar (suspicious)
        if (isValidShell) {
          const amounts = [];
          for (let i = 0; i < currentPath.length - 1; i++) {
            const from = currentPath[i];
            const to = currentPath[i + 1];
            const edgeKey = `${from}_${to}`;
            const txs = txMap.get(edgeKey) || [];
            if (txs.length > 0) {
              const edgeAmount = txs.reduce((sum, tx) => sum + tx.amount, 0);
              amounts.push(edgeAmount);
              totalAmount += edgeAmount;
            }
          }
          
          // Require similar amounts (money muling characteristic)
          if (amounts.length > 1) {
            const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
            const variance = amounts.reduce((sum, amt) => 
              sum + Math.pow(amt - avgAmount, 2), 0) / amounts.length;
            const stdDev = Math.sqrt(variance);
            const coefficientOfVariation = avgAmount > 0 ? stdDev / avgAmount : 1;
            
            // Low variance = suspicious (money muling)
            if (coefficientOfVariation < 0.2) {
              layeredShells.push({
                path: currentPath,
                pattern_type: 'layered_shell',
                path_length: currentPath.length - 1,
                total_amount: totalAmount,
                amount_variance: variance
              });
            }
          }
        }
      }
      return;
    }
    
    const currentNode = currentPath[currentPath.length - 1];
    const neighbors = graph.outNeighbors(currentNode);
    
    neighbors.forEach(neighbor => {
      if (!currentPath.includes(neighbor)) {
        findPaths(startNode, [...currentPath, neighbor], targetLength);
      }
    });
  };
  
  graph.forEachNode((node) => {
    for (let length = 3; length <= 5; length++) {
      findPaths(node, [node], length);
    }
  });
  
  return layeredShells;
}

/**
 * Main enhanced detection function
 */
export function detectFraudPatternsEnhanced(transactions) {
  const startTime = Date.now();
  
  const graph = buildTransactionGraph(transactions);
  
  // Run enhanced detection algorithms
  const { cycles, ringIdMap } = detectCyclesEnhanced(graph, transactions);
  const fanInAccounts = detectFanInEnhanced(graph, transactions);
  const fanOutAccounts = detectFanOutEnhanced(graph, transactions);
  const layeredShells = detectLayeredShellEnhanced(graph, transactions);
  const amountAnomalies = detectAmountAnomalies(transactions, graph);
  const lifecycleAnomalies = analyzeAccountLifecycle(transactions, graph);
  
  // Aggregate suspicious accounts
  const suspiciousAccountsMap = new Map();
  
  // Process cycles
  cycles.forEach(cycle => {
    cycle.accounts.forEach(accountId => {
      if (!suspiciousAccountsMap.has(accountId)) {
        suspiciousAccountsMap.set(accountId, {
          account_id: accountId,
          detected_patterns: [],
          ring_id: cycle.ring_id,
          in_degree: graph.inDegree(accountId),
          out_degree: graph.outDegree(accountId),
          pattern_confidence: {}
        });
      }
      const account = suspiciousAccountsMap.get(accountId);
      if (!account.detected_patterns.includes(cycle.pattern_type)) {
        account.detected_patterns.push(cycle.pattern_type);
      }
      account.ring_id = cycle.ring_id;
      account.pattern_confidence[cycle.pattern_type] = 0.9; // High confidence for cycles
    });
  });
  
  // Process fan-in
  fanInAccounts.forEach(fanIn => {
    if (!suspiciousAccountsMap.has(fanIn.account_id)) {
      suspiciousAccountsMap.set(fanIn.account_id, {
        account_id: fanIn.account_id,
        detected_patterns: [],
        ring_id: null,
        in_degree: graph.inDegree(fanIn.account_id),
        out_degree: graph.outDegree(fanIn.account_id),
        pattern_confidence: {}
      });
    }
    const account = suspiciousAccountsMap.get(fanIn.account_id);
    if (!account.detected_patterns.includes('fan_in')) {
      account.detected_patterns.push('fan_in');
    }
    // Confidence based on amount diversity (lower = more suspicious)
    account.pattern_confidence['fan_in'] = 1 - fanIn.amount_diversity;
  });
  
  // Process fan-out
  fanOutAccounts.forEach(fanOut => {
    if (!suspiciousAccountsMap.has(fanOut.account_id)) {
      suspiciousAccountsMap.set(fanOut.account_id, {
        account_id: fanOut.account_id,
        detected_patterns: [],
        ring_id: null,
        in_degree: graph.inDegree(fanOut.account_id),
        out_degree: graph.outDegree(fanOut.account_id),
        pattern_confidence: {}
      });
    }
    const account = suspiciousAccountsMap.get(fanOut.account_id);
    if (!account.detected_patterns.includes('fan_out')) {
      account.detected_patterns.push('fan_out');
    }
    account.pattern_confidence['fan_out'] = 1 - fanOut.amount_diversity;
  });
  
  // Process layered shells
  layeredShells.forEach(shell => {
    shell.path.forEach(accountId => {
      if (!suspiciousAccountsMap.has(accountId)) {
        suspiciousAccountsMap.set(accountId, {
          account_id: accountId,
          detected_patterns: [],
          ring_id: null,
          in_degree: graph.inDegree(accountId),
          out_degree: graph.outDegree(accountId),
          pattern_confidence: {}
        });
      }
      const account = suspiciousAccountsMap.get(accountId);
      if (!account.detected_patterns.includes('layered_shell')) {
        account.detected_patterns.push('layered_shell');
      }
      account.pattern_confidence['layered_shell'] = 0.75;
    });
  });
  
  // Process amount anomalies
  amountAnomalies.forEach(anomaly => {
    if (!suspiciousAccountsMap.has(anomaly.account_id)) {
      suspiciousAccountsMap.set(anomaly.account_id, {
        account_id: anomaly.account_id,
        detected_patterns: [],
        ring_id: null,
        in_degree: graph.inDegree(anomaly.account_id),
        out_degree: graph.outDegree(anomaly.account_id),
        pattern_confidence: {}
      });
    }
    const account = suspiciousAccountsMap.get(anomaly.account_id);
    if (!account.detected_patterns.includes('amount_anomaly')) {
      account.detected_patterns.push('amount_anomaly');
    }
    account.pattern_confidence['amount_anomaly'] = 0.6;
  });
  
  // Process lifecycle anomalies
  lifecycleAnomalies.forEach(anomaly => {
    if (!suspiciousAccountsMap.has(anomaly.account_id)) {
      suspiciousAccountsMap.set(anomaly.account_id, {
        account_id: anomaly.account_id,
        detected_patterns: [],
        ring_id: null,
        in_degree: graph.inDegree(anomaly.account_id),
        out_degree: graph.outDegree(anomaly.account_id),
        pattern_confidence: {}
      });
    }
    const account = suspiciousAccountsMap.get(anomaly.account_id);
    if (!account.detected_patterns.includes(anomaly.pattern_type)) {
      account.detected_patterns.push(anomaly.pattern_type);
    }
    account.pattern_confidence[anomaly.pattern_type] = 0.7;
  });
  
  // Build fraud rings
  const fraudRingsMap = new Map();
  cycles.forEach(cycle => {
    if (!fraudRingsMap.has(cycle.ring_id)) {
      fraudRingsMap.set(cycle.ring_id, {
        ring_id: cycle.ring_id,
        member_accounts: [...new Set(cycle.accounts)],
        pattern_type: 'cycle',
        risk_score: 0
      });
    }
  });
  
  const processingTime = (Date.now() - startTime) / 1000;
  
  return {
    suspiciousAccounts: Array.from(suspiciousAccountsMap.values()),
    fraudRings: Array.from(fraudRingsMap.values()),
    graph,
    processingTime
  };
}
