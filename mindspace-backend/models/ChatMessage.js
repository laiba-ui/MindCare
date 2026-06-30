const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  sender: {
    type: String,
    enum: ['user', 'maia'],
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'low',
  },
  sentimentScore: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);