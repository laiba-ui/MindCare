// backend/models/Mood.js
const mongoose = require('mongoose');

const MoodSchema = new mongoose.Schema({
  user:           { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  emoji:          { type: String, required: true },
  label:          { type: String, required: true },
  score:          { type: Number, required: true, min: 1, max: 5 },
  color:          { type: String, default: '#6C63FF' },
  note:           { type: String, default: '' },
  dateKey:        { type: String, required: true },
  // ✅ Sentiment analysis results stored with each mood entry
  riskLevel:      { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
  sentimentScore: { type: Number, default: 0 },
  loggedAt:       { type: Date, default: Date.now },
});

// One mood per user per day
MoodSchema.index({ user: 1, dateKey: 1 }, { unique: true });

module.exports = mongoose.model('Mood', MoodSchema);