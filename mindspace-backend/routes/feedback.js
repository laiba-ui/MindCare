// backend/routes/feedback.js
const express  = require('express');
const Feedback = require('../models/Feedback');
const protect  = require('../middleware/auth');
const router   = express.Router();

// ── POST /api/feedback/send ───────────────────────────────────────────────────
router.post('/send', protect, async (req, res) => {
  try {
    const { category, rating, message } = req.body;
    if (!message || !message.trim())
      return res.status(400).json({ message: 'Feedback message is required.' });

    await Feedback.create({
      user: req.user._id,
      category: category || 'General Feedback',
      rating:   rating ?? null,
      message:  message.trim(),
    });
    res.json({ message: 'Feedback received. Thank you! 🙏' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;