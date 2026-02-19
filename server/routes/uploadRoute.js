import express from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import { Readable } from 'stream';
import Transaction from '../models/Transaction.js';
import SuspiciousAccount from '../models/SuspiciousAccount.js';
import FraudRing from '../models/FraudRing.js';
import { detectFraudPatterns } from '../services/detectionService.js';
import { scoreSuspiciousAccounts } from '../services/scoringService.js';
import { detectFraudPatternsEnhanced } from '../services/enhancedDetectionService.js';
import { scoreSuspiciousAccountsEnhanced } from '../services/enhancedScoringService.js';
import { getAllAccountIds } from '../services/graphBuilder.js';
import dayjs from 'dayjs';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * Parse CSV file and validate structure
 */
function parseCSV(fileBuffer) {
  return new Promise((resolve, reject) => {
    const results = [];
    const requiredColumns = ['transaction_id', 'sender_id', 'receiver_id', 'amount', 'timestamp'];
    let headers = null;
    
    const stream = Readable.from(fileBuffer.toString());
    
    stream
      .pipe(csv())
      .on('headers', (headerList) => {
        headers = headerList;
        // Validate headers
        const missingColumns = requiredColumns.filter(col => !headers.includes(col));
        if (missingColumns.length > 0) {
          reject(new Error(`Missing required columns: ${missingColumns.join(', ')}`));
          return;
        }
      })
      .on('data', (data) => {
        // Validate row data
        const missingFields = requiredColumns.filter(col => !data[col] || data[col].trim() === '');
        if (missingFields.length > 0) {
          return; // Skip invalid rows
        }
        
        // Parse timestamp (YYYY-MM-DD HH:MM:SS)
        let timestamp;
        try {
          timestamp = dayjs(data.timestamp, 'YYYY-MM-DD HH:mm:ss').toDate();
          if (!timestamp || isNaN(timestamp.getTime())) {
            return; // Skip invalid timestamp
          }
        } catch (error) {
          return; // Skip invalid timestamp
        }
        
        // Parse amount
        const amount = parseFloat(data.amount);
        if (isNaN(amount)) {
          return; // Skip invalid amount
        }
        
        results.push({
          transaction_id: data.transaction_id.trim(),
          sender_id: data.sender_id.trim(),
          receiver_id: data.receiver_id.trim(),
          amount: amount,
          timestamp: timestamp
        });
      })
      .on('end', () => {
        if (results.length === 0) {
          reject(new Error('No valid transactions found in CSV'));
          return;
        }
        resolve(results);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

/**
 * POST /api/upload
 * Upload CSV file and process transactions
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Parse CSV
    const transactions = await parseCSV(req.file.buffer);
    
    // Clear existing data (optional - for fresh analysis)
    await Transaction.deleteMany({});
    await SuspiciousAccount.deleteMany({});
    await FraudRing.deleteMany({});
    
    // Store transactions in MongoDB
    await Transaction.insertMany(transactions);
    
    // Run ENHANCED detection algorithms (optimized for precision/recall)
    let detectionResults = detectFraudPatternsEnhanced(transactions);
    
    // Score suspicious accounts with enhanced scoring
    let scoredResults = scoreSuspiciousAccountsEnhanced(detectionResults, transactions);

    // Fallback: if enhanced pipeline finds nothing, fall back to baseline rules
    if (!scoredResults.suspiciousAccounts || scoredResults.suspiciousAccounts.length === 0) {
      const baselineDetection = detectFraudPatterns(transactions);
      const baselineScored = scoreSuspiciousAccounts(baselineDetection, transactions);
      detectionResults = baselineDetection;
      scoredResults = {
        ...baselineScored,
        metrics: scoredResults.metrics || baselineScored.metrics || {},
      };
    }
    
    // Store suspicious accounts
    if (scoredResults.suspiciousAccounts.length > 0) {
      await SuspiciousAccount.insertMany(scoredResults.suspiciousAccounts);
    }
    
    // Store fraud rings
    if (scoredResults.fraudRings.length > 0) {
      await FraudRing.insertMany(scoredResults.fraudRings);
    }
    
    // Get all account IDs for summary
    const allAccountIds = getAllAccountIds(transactions);
    
    // Build response in exact format required
    const response = {
      suspicious_accounts: scoredResults.suspiciousAccounts.map(acc => ({
        account_id: acc.account_id,
        suspicion_score: acc.suspicion_score,
        detected_patterns: acc.detected_patterns,
        ring_id: acc.ring_id || null,
        confidence_score: acc.confidence_score || 0
      })),
      fraud_rings: scoredResults.fraudRings.map(ring => ({
        ring_id: ring.ring_id,
        member_accounts: ring.member_accounts,
        pattern_type: ring.pattern_type,
        risk_score: ring.risk_score
      })),
      summary: {
        total_accounts_analyzed: allAccountIds.length,
        suspicious_accounts_flagged: scoredResults.suspiciousAccounts.length,
        fraud_rings_detected: scoredResults.fraudRings.length,
        processing_time_seconds: parseFloat(scoredResults.processingTime.toFixed(2))
      },
      metrics: scoredResults.metrics || {}
    };
    
    res.json(response);
    
  } catch (error) {
    console.error('Upload error:', error);
    // In development, include stack for easier debugging
    const responsePayload = { error: error.message || 'Failed to process CSV file' };
    if (process.env.NODE_ENV !== 'production' && error.stack) {
      responsePayload.stack = error.stack;
    }
    res.status(500).json(responsePayload);
  }
});

/**
 * GET /api/results
 * Get latest analysis results
 */
router.get('/results', async (req, res) => {
  try {
    const suspiciousAccounts = await SuspiciousAccount.find({})
      .sort({ suspicion_score: -1 })
      .lean();
    
    const fraudRings = await FraudRing.find({})
      .sort({ risk_score: -1 })
      .lean();
    
    const totalAccounts = await Transaction.distinct('sender_id', {})
      .then(senders => {
        return Transaction.distinct('receiver_id', {})
          .then(receivers => {
            return new Set([...senders, ...receivers]).size;
          });
      });
    
    const response = {
      suspicious_accounts: suspiciousAccounts.map(acc => ({
        account_id: acc.account_id,
        suspicion_score: acc.suspicion_score,
        detected_patterns: acc.detected_patterns,
        ring_id: acc.ring_id || null
      })),
      fraud_rings: fraudRings.map(ring => ({
        ring_id: ring.ring_id,
        member_accounts: ring.member_accounts,
        pattern_type: ring.pattern_type,
        risk_score: ring.risk_score
      })),
      summary: {
        total_accounts_analyzed: totalAccounts,
        suspicious_accounts_flagged: suspiciousAccounts.length,
        fraud_rings_detected: fraudRings.length,
        processing_time_seconds: 0
      }
    };
    
    res.json(response);
    
  } catch (error) {
    console.error('Results error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch results' });
  }
});

/**
 * GET /api/graph
 * Get graph data for visualization
 */
router.get('/graph', async (req, res) => {
  try {
    const transactions = await Transaction.find({}).lean();
    
    if (transactions.length === 0) {
      return res.json({ nodes: [], edges: [] });
    }
    
    const { buildTransactionGraph } = await import('../services/graphBuilder.js');
    const graph = buildTransactionGraph(transactions);
    
    const suspiciousAccounts = await SuspiciousAccount.find({}).lean();
    const suspiciousAccountIds = new Set(
      suspiciousAccounts.map(acc => acc.account_id)
    );
    
    const fraudRings = await FraudRing.find({}).lean();
    const ringColorMap = new Map();
    fraudRings.forEach((ring, index) => {
      ring.member_accounts.forEach(accountId => {
        ringColorMap.set(accountId, ring.ring_id);
      });
    });
    
    // Convert graph to nodes and edges format
    const nodes = [];
    const edges = [];
    
    graph.forEachNode((nodeId) => {
      const nodeData = graph.getNodeAttributes(nodeId);
      const isSuspicious = suspiciousAccountIds.has(nodeId);
      const ringId = ringColorMap.get(nodeId);
      
      nodes.push({
        id: nodeId,
        label: nodeId,
        size: Math.sqrt(nodeData.in_degree + nodeData.out_degree) * 2 + 5,
        color: isSuspicious ? '#ef4444' : '#3b82f6',
        ring_id: ringId || null,
        in_degree: nodeData.in_degree,
        out_degree: nodeData.out_degree,
        suspicion_score: suspiciousAccounts.find(acc => acc.account_id === nodeId)?.suspicion_score || 0
      });
    });
    
    graph.forEachEdge((edgeId, attributes, source, target) => {
      edges.push({
        id: edgeId,
        source: source,
        target: target,
        size: Math.log(attributes.amount + 1) * 0.5,
        color: '#94a3b8'
      });
    });
    
    res.json({ nodes, edges });
    
  } catch (error) {
    console.error('Graph error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch graph data' });
  }
});

export default router;
