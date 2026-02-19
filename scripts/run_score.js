import { detectFraudPatternsEnhanced } from "../server/services/enhancedDetectionService.js";
import { scoreSuspiciousAccountsEnhanced } from "../server/services/enhancedScoringService.js";

const sample = [
  {
    transaction_id: "t1",
    sender_id: "A",
    receiver_id: "B",
    amount: 100,
    timestamp: "2024-01-01 00:00:00",
  },
  {
    transaction_id: "t2",
    sender_id: "B",
    receiver_id: "C",
    amount: 200,
    timestamp: "2024-01-02 00:00:00",
  },
  {
    transaction_id: "t3",
    sender_id: "C",
    receiver_id: "A",
    amount: 150,
    timestamp: "2024-01-03 00:00:00",
  },
];

const detection = detectFraudPatternsEnhanced(sample);
const scored = scoreSuspiciousAccountsEnhanced(detection, sample);
console.log(
  JSON.stringify(
    {
      suspiciousAccounts: scored.suspiciousAccounts,
      metrics: scored.metrics,
    },
    null,
    2,
  ),
);

