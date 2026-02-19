import dayjs from 'dayjs';

/**
 * Bonus Features - Advanced graph analysis
 */

/**
 * Calculate Betweenness Centrality for nodes
 * Nodes with high betweenness are critical bridges in the network
 */
export function calculateBetweennessCentrality(graph) {
  const centrality = new Map();
  
  // Initialize centrality scores
  graph.forEachNode((node) => {
    centrality.set(node, 0);
  });
  
  // For each node, calculate shortest paths through it
  graph.forEachNode((source) => {
    // BFS to find shortest paths from source
    const distances = new Map();
    const paths = new Map();
    const queue = [source];
    
    distances.set(source, 0);
    paths.set(source, [[]]);
    
    while (queue.length > 0) {
      const current = queue.shift();
      const neighbors = graph.outNeighbors(current);
      
      neighbors.forEach((neighbor) => {
        if (!distances.has(neighbor)) {
          distances.set(neighbor, distances.get(current) + 1);
          paths.set(neighbor, []);
          queue.push(neighbor);
        }
        
        if (distances.get(neighbor) === distances.get(current) + 1) {
          const currentPaths = paths.get(current);
          currentPaths.forEach(path => {
            paths.get(neighbor).push([...path, current]);
          });
        }
      });
    }
    
    // Count paths through each node
    graph.forEachNode((node) => {
      if (node !== source) {
        const nodePaths = paths.get(node);
        if (nodePaths && nodePaths.length > 0) {
          const currentScore = centrality.get(node) || 0;
          centrality.set(node, currentScore + nodePaths.length);
        }
      }
    });
  });
  
  // Normalize scores
  const maxScore = Math.max(...Array.from(centrality.values()));
  const normalized = new Map();
  centrality.forEach((score, node) => {
    normalized.set(node, maxScore > 0 ? (score / maxScore) * 100 : 0);
  });
  
  return normalized;
}

/**
 * Calculate PageRank scores for nodes
 * Identifies influential nodes in the network
 */
export function calculatePageRank(graph, dampingFactor = 0.85, iterations = 20) {
  const nodes = Array.from(graph.nodes());
  const nodeCount = nodes.length;
  
  if (nodeCount === 0) return new Map();
  
  // Initialize PageRank scores
  const pageRank = new Map();
  nodes.forEach((node) => {
    pageRank.set(node, 1 / nodeCount);
  });
  
  // Iterate PageRank algorithm
  for (let iter = 0; iter < iterations; iter++) {
    const newPageRank = new Map();
    
    nodes.forEach((node) => {
      let rank = (1 - dampingFactor) / nodeCount;
      
      // Sum contributions from incoming neighbors
      const inNeighbors = graph.inNeighbors(node);
      inNeighbors.forEach((neighbor) => {
        const outDegree = graph.outDegree(neighbor);
        if (outDegree > 0) {
          rank += dampingFactor * (pageRank.get(neighbor) / outDegree);
        }
      });
      
      newPageRank.set(node, rank);
    });
    
    // Update PageRank scores
    newPageRank.forEach((rank, node) => {
      pageRank.set(node, rank);
    });
  }
  
  // Normalize to 0-100 scale
  const maxRank = Math.max(...Array.from(pageRank.values()));
  const normalized = new Map();
  pageRank.forEach((rank, node) => {
    normalized.set(node, maxRank > 0 ? (rank / maxRank) * 100 : 0);
  });
  
  return normalized;
}

/**
 * Calculate transaction velocity scores
 * Identifies accounts with unusually high transaction frequency
 */
export function calculateTransactionVelocity(transactions) {
  const velocityScores = new Map();
  const accountTransactions = new Map();
  
  // Group transactions by account
  transactions.forEach((tx) => {
    [tx.sender_id, tx.receiver_id].forEach((accountId) => {
      if (!accountTransactions.has(accountId)) {
        accountTransactions.set(accountId, []);
      }
      accountTransactions.get(accountId).push(tx);
    });
  });
  
  // Calculate velocity for each account
  accountTransactions.forEach((txs, accountId) => {
    if (txs.length < 2) {
      velocityScores.set(accountId, 0);
      return;
    }
    
    // Sort by timestamp
    txs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    // Calculate average time between transactions
    let totalTimeDiff = 0;
    for (let i = 1; i < txs.length; i++) {
      const timeDiff = new Date(txs[i].timestamp) - new Date(txs[i - 1].timestamp);
      totalTimeDiff += timeDiff;
    }
    
    const avgTimeDiff = totalTimeDiff / (txs.length - 1);
    const transactionsPerHour = (3600000 / avgTimeDiff) * txs.length;
    
    // Score based on velocity (higher = more suspicious)
    // Normalize: > 50 transactions/hour = high velocity
    const score = Math.min(100, (transactionsPerHour / 50) * 100);
    velocityScores.set(accountId, score);
  });
  
  return velocityScores;
}

/**
 * Detect anomalies using PageRank
 * Accounts with high PageRank but low degree are suspicious
 */
export function detectPageRankAnomalies(graph, pageRankScores) {
  const anomalies = [];
  
  graph.forEachNode((node) => {
    const pageRank = pageRankScores.get(node) || 0;
    const inDegree = graph.inDegree(node);
    const outDegree = graph.outDegree(node);
    const totalDegree = inDegree + outDegree;
    
    // Anomaly: High PageRank but low degree (unusual influence)
    if (pageRank > 50 && totalDegree < 5) {
      anomalies.push({
        account_id: node,
        page_rank: pageRank,
        total_degree: totalDegree,
        anomaly_type: 'high_pagerank_low_degree'
      });
    }
  });
  
  return anomalies;
}
