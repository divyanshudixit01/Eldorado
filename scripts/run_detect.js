import { detectFraudPatternsEnhanced } from '../server/services/enhancedDetectionService.js';

(async () => {
  try {
    const sample = [
      { transaction_id: 't1', sender_id: 'A', receiver_id: 'B', amount: 100, timestamp: '2024-01-01 00:00:00' },
      { transaction_id: 't2', sender_id: 'B', receiver_id: 'C', amount: 200, timestamp: '2024-01-02 00:00:00' },
      { transaction_id: 't3', sender_id: 'C', receiver_id: 'A', amount: 150, timestamp: '2024-01-03 00:00:00' }
    ];
    const res = detectFraudPatternsEnhanced(sample);
    console.log('Detection result:', res);
  } catch (err) {
    console.error('Error while running detectFraudPatternsEnhanced:', err);
  }
})();
