// backend/routes/profile.js
const express = require('express');
const User    = require('../models/User');
const protect = require('../middleware/auth');
const router  = express.Router();

// ── GET /api/profile/me ───────────────────────────────────────────────────────
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// ── PUT /api/profile/update ───────────────────────────────────────────────────
router.put('/update', protect, async (req, res) => {
  try {
    const { name, university, year, bio, phone, avatar } = req.body;
    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { name, university, year, bio, phone, avatar },
      { new: true, runValidators: true },
    ).select('-password');
    res.json({ message: 'Profile updated!', user: updated });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// ── PUT /api/profile/change-password ─────────────────────────────────────────
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ message: 'Both current and new password required.' });
    if (newPassword.length < 6)
      return res.status(400).json({ message: 'New password must be at least 6 characters.' });

    const user  = await User.findById(req.user._id);
    const match = await user.matchPassword(currentPassword);
    if (!match) return res.status(401).json({ message: 'Current password is incorrect.' });

    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password changed successfully!' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;