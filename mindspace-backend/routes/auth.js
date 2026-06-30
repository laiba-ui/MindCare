// backend/routes/auth.js
const express = require('express');
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');
const router  = express.Router();

const makeToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// ── POST /api/auth/register ───────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, university, year } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email and password are required.' });

    if (password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(400).json({ message: 'An account with this email already exists.' });

    const user = await User.create({ name, email, password, university: university || '', year: year || '' });

    res.status(201).json({
      message: 'Account created successfully!',
      token:   makeToken(user._id),
      user: {
        id:         user._id,
        name:       user.name,
        email:      user.email,
        university: user.university,
        year:       user.year,
        avatar:     user.avatar,
        streak:     user.streak,
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required.' });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({ message: 'No account found with this email.' });

    const match = await user.matchPassword(password);
    if (!match)
      return res.status(401).json({ message: 'Incorrect password.' });

    res.json({
      message: 'Login successful!',
      token:   makeToken(user._id),
      user: {
        id:         user._id,
        name:       user.name,
        email:      user.email,
        university: user.university,
        year:       user.year,
        avatar:     user.avatar,
        streak:     user.streak,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

const nodemailer = require('nodemailer');


// In-memory OTP store { email: { otp, expiry } }
const otpStore = {};

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

// ── POST /api/auth/forgot-password ───────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    const user = await User.findOne({ email });
    if (!user) return res.json({ message: 'If this email exists, an OTP has been sent.' });

    // Generate 6-digit OTP
    const otp    = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store OTP in memory
    otpStore[email] = { otp, expiry };

    // Send OTP email
    await transporter.sendMail({
      from:    `"MindCare App" <${process.env.EMAIL_USER}>`,
      to:      email,
      subject: '🔐 Your MindCare Password Reset OTP',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;">
          <div style="background:#6C63FF;color:white;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
            <h2 style="margin:0;">🔐 Password Reset OTP</h2>
          </div>
          <div style="background:#f9f9f9;padding:24px;border-radius:0 0 12px 12px;text-align:center;">
            <p style="color:#444;">Hi <strong>${user.name}</strong>,</p>
            <p style="color:#444;">Your OTP code is:</p>
            <div style="font-size:40px;font-weight:bold;color:#6C63FF;letter-spacing:10px;margin:20px 0;">
              ${otp}
            </div>
            <p style="color:#888;font-size:13px;">This code expires in <strong>10 minutes</strong>.</p>
            <p style="color:#888;font-size:12px;">If you didn't request this, please ignore this email.</p>
          </div>
        </div>
      `,
    });

    console.log(`✅ OTP sent to ${email}`);
    res.json({ message: 'OTP sent to your email.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
  }
});

// ── POST /api/auth/verify-otp ─────────────────────────────────────────────────
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required.' });

    const record = otpStore[email];
    if (!record)           return res.status(400).json({ message: 'No OTP found. Please request a new one.' });
    if (Date.now() > record.expiry) {
      delete otpStore[email];
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }
    if (record.otp !== otp) return res.status(400).json({ message: 'Incorrect OTP. Please try again.' });

    res.json({ message: 'OTP verified successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// ── POST /api/auth/reset-password ─────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword)
      return res.status(400).json({ message: 'All fields are required.' });

    if (newPassword.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });

    const record = otpStore[email];
    if (!record)           return res.status(400).json({ message: 'No OTP found. Please request a new one.' });
    if (Date.now() > record.expiry) {
      delete otpStore[email];
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }
    if (record.otp !== otp) return res.status(400).json({ message: 'Incorrect OTP.' });

    // Update password
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    user.password = newPassword;
await user.save();

    // Clear OTP
    delete otpStore[email];

    console.log(`✅ Password reset for ${email}`);
    res.json({ message: 'Password reset successfully!' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ── POST /api/auth/google ─────────────────────────────────────────────────────
router.post('/google', async (req, res) => {
  try {
    const { email, name, googleId, avatar } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    // Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      // Existing user — just log them in
      return res.json({
        message: 'Login successful!',
        token:   makeToken(user._id),
        user: {
          id:         user._id,
          name:       user.name,
          email:      user.email,
          university: user.university,
          year:       user.year,
          avatar:     user.avatar,
          streak:     user.streak,
        },
      });
    }

    // New user — create account
    user = await User.create({
      name,
      email,
      password:  googleId + process.env.JWT_SECRET, // dummy password they'll never use
      avatar:    avatar || '🧠',
      university: '',
      year:       '',
    });

    res.status(201).json({
      message: 'Account created successfully!',
      token:   makeToken(user._id),
      user: {
        id:         user._id,
        name:       user.name,
        email:      user.email,
        university: user.university,
        year:       user.year,
        avatar:     user.avatar,
        streak:     user.streak,
      },
    });
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;