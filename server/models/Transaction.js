import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  transaction_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  sender_id: {
    type: String,
    required: true,
    index: true
  },
  receiver_id: {
    type: String,
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    required: true,
    index: true
  }
}, {
  timestamps: true
});

// Compound indexes for common queries
transactionSchema.index({ sender_id: 1, timestamp: 1 });
transactionSchema.index({ receiver_id: 1, timestamp: 1 });

export default mongoose.model('Transaction', transactionSchema);
