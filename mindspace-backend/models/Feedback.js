// backend/models/Feedback.js
const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
  user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  category: { type: String, default: 'General Feedback' },
  rating:   { type: Number, min: 0, max: 4 },
  message:  { type: String, required: true },
  sentAt:   { type: Date, default: Date.now },
});

module.exports = mongoose.model('Feedback', FeedbackSchema);