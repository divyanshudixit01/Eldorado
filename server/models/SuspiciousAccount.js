import mongoose from 'mongoose';

const suspiciousAccountSchema = new mongoose.Schema({
  account_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  suspicion_score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  detected_patterns: [{
    type: String
  }],
  ring_id: {
    type: String,
    index: true
  },
  in_degree: {
    type: Number,
    default: 0
  },
  out_degree: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

suspiciousAccountSchema.index({ suspicion_score: -1 });

export default mongoose.model('SuspiciousAccount', suspiciousAccountSchema);
