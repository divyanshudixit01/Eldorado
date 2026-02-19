import mongoose from 'mongoose';

const fraudRingSchema = new mongoose.Schema({
  ring_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  member_accounts: [{
    type: String
  }],
  pattern_type: {
    type: String,
    required: true,
    enum: ['cycle', 'fan_in', 'fan_out', 'layered_shell', 'mixed']
  },
  risk_score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  }
}, {
  timestamps: true
});

fraudRingSchema.index({ risk_score: -1 });

export default mongoose.model('FraudRing', fraudRingSchema);
