import dayjs from 'dayjs';
import { buildTransactionGraph, getAllAccountIds } from './graphBuilder.js';

/**
 * Detection Service - Implements all fraud detection algorithms
 */

/**
 * Detect simple cycles of length 3 to 5 using DFS
 */
function detectCycles(graph, minLength = 3, maxLength = 5) {
  const cycles = [];
  const ringIdMap = new Map(); // Maps account_id to ring_id
  const cycleSet = new Set(); // Track cycles to avoid duplicates
  let ringCounter = 0;
  
  const dfs = (node, path, startNode, visited) => {
    if (path.length > maxLength) return;
    
    // Don't mark startNode as visited until we're done with it
    if (node !== startNode) {
      visited.add(node);
    }
    path.push(node);
    
    // Check if we've formed a cycle
    if (path.length >= minLength && path.length <= maxLength) {
      const neighbors = graph.outNeighbors(node);
      if (neighbors.includes(startNode)) {
        // Found a cycle - create normalized cycle key to avoid duplicates
        const cycle = [...path, startNode];
        const cycleKey = [...new Set(cycle)].sort().join('->');
        
        if (!cycleSet.has(cycleKey)) {
          cycleSet.add(cycleKey);
          const ringId = `RING_${String(ringCounter++).padStart(3, '0')}`;
          
          // Assign ring_id to all accounts in cycle
          cycle.forEach(accountId => {
            ringIdMap.set(accountId, ringId);
          });
          
          cycles.push({
            accounts: cycle,
            length: cycle.length - 1, // Exclude duplicate start node
            ring_id: ringId,
            pattern_type: `cycle_length_${cycle.length - 1}`
          });
        }
      }
    }
    
    // Continue DFS
    if (path.length < maxLength) {
      const neighbors = graph.outNeighbors(node);
      neighbors.forEach(neighbor => {
        // Allow revisiting startNode to complete cycle, but not other visited nodes
        if (!visited.has(neighbor) || neighbor === startNode) {
          dfs(neighbor, [...path], startNode, visited);
        }
      });
    }
    
    // Backtrack: remove from visited if not startNode
    if (node !== startNode) {
      visited.delete(node);
    }
    path.pop();
  };
  
  // Start DFS from each node
  graph.forEachNode((node) => {
    const visited = new Set();
    dfs(node, [], node, visited);
  });
  
  return { cycles, ringIdMap };
}

/**
 * Detect Fan-In pattern: receiver has >= 10 unique senders within 72 hours
 */
function detectFanIn(graph, transactions) {
  const fanInAccounts = [];
  const timeWindow = 72 * 60 * 60 * 1000; // 72 hours in milliseconds
  
  graph.forEachNode((node) => {
    const inDegree = graph.inDegree(node);
    
    if (inDegree >= 10) {
      // Get all incoming transactions for this node
      const incomingTransactions = transactions.filter(t => 
        t.receiver_id === node
      );
      
      // Group by time windows
      const timeGroups = new Map();
      incomingTransactions.forEach(t => {
        const timestamp = new Date(t.timestamp).getTime();
        const windowKey = Math.floor(timestamp / timeWindow);
        
        if (!timeGroups.has(windowKey)) {
          timeGroups.set(windowKey, new Set());
        }
        timeGroups.get(windowKey).add(t.sender_id);
      });
      
      // Check if any time window has >= 10 unique senders
      for (const [windowKey, senders] of timeGroups) {
        if (senders.size >= 10) {
          fanInAccounts.push({
            account_id: node,
            pattern_type: 'fan_in',
            unique_senders: senders.size,
            time_window: windowKey
          });
          break;
        }
      }
    }
  });
  
  return fanInAccounts;
}

/**
 * Detect Fan-Out pattern: sender sends to >= 10 unique receivers within 72 hours
 */
function detectFanOut(graph, transactions) {
  const fanOutAccounts = [];
  const timeWindow = 72 * 60 * 60 * 1000; // 72 hours in milliseconds
  
  graph.forEachNode((node) => {
    const outDegree = graph.outDegree(node);
    
    if (outDegree >= 10) {
      // Get all outgoing transactions for this node
      const outgoingTransactions = transactions.filter(t => 
        t.sender_id === node
      );
      
      // Group by time windows
      const timeGroups = new Map();
      outgoingTransactions.forEach(t => {
        const timestamp = new Date(t.timestamp).getTime();
        const windowKey = Math.floor(timestamp / timeWindow);
        
        if (!timeGroups.has(windowKey)) {
          timeGroups.set(windowKey, new Set());
        }
        timeGroups.get(windowKey).add(t.receiver_id);
      });
      
      // Check if any time window has >= 10 unique receivers
      for (const [windowKey, receivers] of timeGroups) {
        if (receivers.size >= 10) {
          fanOutAccounts.push({
            account_id: node,
            pattern_type: 'fan_out',
            unique_receivers: receivers.size,
            time_window: windowKey
          });
          break;
        }
      }
    }
  });
  
  return fanOutAccounts;
}

/**
 * Detect Layered Shell Networks: paths of length >= 3 with intermediate nodes having <= 3 total transactions
 */
function detectLayeredShell(graph) {
  const layeredShells = [];
  const visitedPaths = new Set();
  
  // Find all paths of length >= 3
  const findPaths = (startNode, currentPath, targetLength) => {
    if (currentPath.length === targetLength) {
      const pathKey = currentPath.join('->');
      if (!visitedPaths.has(pathKey)) {
        visitedPaths.add(pathKey);
        
        // Check if intermediate nodes have <= 3 total transactions
        let isValidShell = true;
        const intermediateNodes = currentPath.slice(1, -1);
        
        for (const node of intermediateNodes) {
          const totalTransactions = graph.inDegree(node) + graph.outDegree(node);
          if (totalTransactions > 3) {
            isValidShell = false;
            break;
          }
        }
        
        if (isValidShell) {
          layeredShells.push({
            path: currentPath,
            pattern_type: 'layered_shell',
            path_length: currentPath.length - 1
          });
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
  
  // Check paths of length 3, 4, and 5
  graph.forEachNode((node) => {
    for (let length = 3; length <= 5; length++) {
      findPaths(node, [node], length);
    }
  });
  
  return layeredShells;
}

/**
 * Main detection function that runs all algorithms
 */
export function detectFraudPatterns(transactions) {
  const startTime = Date.now();
  
  // Build graph
  const graph = buildTransactionGraph(transactions);
  
  // Run all detection algorithms
  const { cycles, ringIdMap } = detectCycles(graph);
  const fanInAccounts = detectFanIn(graph, transactions);
  const fanOutAccounts = detectFanOut(graph, transactions);
  const layeredShells = detectLayeredShell(graph);
  
  // Aggregate suspicious accounts
  const suspiciousAccountsMap = new Map();
  
  // Process cycles
  cycles.forEach(cycle => {
    cycle.accounts.forEach(accountId => {
      if (accountId !== cycle.accounts[0] || cycle.accounts.length > 1) {
        if (!suspiciousAccountsMap.has(accountId)) {
          suspiciousAccountsMap.set(accountId, {
            account_id: accountId,
            detected_patterns: [],
            ring_id: cycle.ring_id,
            in_degree: graph.inDegree(accountId),
            out_degree: graph.outDegree(accountId)
          });
        }
        const account = suspiciousAccountsMap.get(accountId);
        if (!account.detected_patterns.includes(cycle.pattern_type)) {
          account.detected_patterns.push(cycle.pattern_type);
        }
        account.ring_id = cycle.ring_id;
      }
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
        out_degree: graph.outDegree(fanIn.account_id)
      });
    }
    const account = suspiciousAccountsMap.get(fanIn.account_id);
    if (!account.detected_patterns.includes('fan_in')) {
      account.detected_patterns.push('fan_in');
    }
  });
  
  // Process fan-out
  fanOutAccounts.forEach(fanOut => {
    if (!suspiciousAccountsMap.has(fanOut.account_id)) {
      suspiciousAccountsMap.set(fanOut.account_id, {
        account_id: fanOut.account_id,
        detected_patterns: [],
        ring_id: null,
        in_degree: graph.inDegree(fanOut.account_id),
        out_degree: graph.outDegree(fanOut.account_id)
      });
    }
    const account = suspiciousAccountsMap.get(fanOut.account_id);
    if (!account.detected_patterns.includes('fan_out')) {
      account.detected_patterns.push('fan_out');
    }
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
          out_degree: graph.outDegree(accountId)
        });
      }
      const account = suspiciousAccountsMap.get(accountId);
      if (!account.detected_patterns.includes('layered_shell')) {
        account.detected_patterns.push('layered_shell');
      }
    });
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
