import pkg from 'graphology';
const { DirectedGraph } = pkg;

/**
 * Builds a directed graph from transaction data
 * Nodes: account_ids
 * Edges: sender_id -> receiver_id with amount and timestamp attributes
 */
export function buildTransactionGraph(transactions) {
  const graph = new DirectedGraph();
  
  // Add nodes and edges from transactions
  transactions.forEach(transaction => {
    const { sender_id, receiver_id, amount, timestamp } = transaction;
    
    // Add nodes if they don't exist
    if (!graph.hasNode(sender_id)) {
      graph.addNode(sender_id, {
        account_id: sender_id,
        in_degree: 0,
        out_degree: 0
      });
    }
    
    if (!graph.hasNode(receiver_id)) {
      graph.addNode(receiver_id, {
        account_id: receiver_id,
        in_degree: 0,
        out_degree: 0
      });
    }
    
    // Add edge with attributes
    const edgeKey = `${sender_id}_${receiver_id}`;
    if (!graph.hasEdge(sender_id, receiver_id)) {
      graph.addEdge(sender_id, receiver_id, {
        amount: amount,
        timestamp: timestamp,
        transaction_count: 1
      });
    } else {
      // If edge exists, aggregate amounts and update count
      const existingEdge = graph.getEdgeAttributes(sender_id, receiver_id);
      graph.setEdgeAttribute(sender_id, receiver_id, 'amount', 
        existingEdge.amount + amount);
      graph.setEdgeAttribute(sender_id, receiver_id, 'transaction_count', 
        existingEdge.transaction_count + 1);
    }
  });
  
  // Calculate degrees for each node
  graph.forEachNode((node) => {
    const inDegree = graph.inDegree(node);
    const outDegree = graph.outDegree(node);
    graph.setNodeAttribute(node, 'in_degree', inDegree);
    graph.setNodeAttribute(node, 'out_degree', outDegree);
  });
  
  return graph;
}

/**
 * Get all unique account IDs from transactions
 */
export function getAllAccountIds(transactions) {
  const accountSet = new Set();
  transactions.forEach(t => {
    accountSet.add(t.sender_id);
    accountSet.add(t.receiver_id);
  });
  return Array.from(accountSet);
}
