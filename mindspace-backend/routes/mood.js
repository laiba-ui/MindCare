// backend/routes/mood.js
// Now uses real Hugging Face BERT sentiment analysis on mood notes

const express            = require('express');
const nodemailer         = require('nodemailer');
const Mood               = require('../models/Mood');
const User               = require('../models/User');
const protect            = require('../middleware/auth');
const { analyzeSentiment } = require('../services/sentiment');

//Input Sanitization Helper
const sanitize = (str, maxLength = 500) => {
  if (typeof str !== 'string') return '';
  return str
    .trim()
    .replace(/<[^>]*>/g, '')        // remove HTML/script tags only
    .replace(/javascript:/gi, '')   // remove javascript: protocol
    .slice(0, maxLength);           // limit length
};
const router             = express.Router();

// ── Email transporter ─────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

const sendCounselorAlert = async (userName, userEmail, moodLabel, note, riskLevel, riskScore) => {
  try {
    const riskColor = riskLevel === 'high' ? '#FF4D5A' : '#FFB347';
    await transporter.sendMail({
      from:    `"MindSpace App" <${process.env.EMAIL_USER}>`,
      to:      process.env.COUNSELOR_EMAIL,
      subject: `⚠️ ${riskLevel.toUpperCase()} Risk Alert — ${userName}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#6C63FF;color:white;padding:20px;border-radius:10px 10px 0 0;">
            <h2>⚠️ MindSpace — ${riskLevel.toUpperCase()} Risk Alert</h2>
          </div>
          <div style="background:#f9f9f9;padding:20px;border-radius:0 0 10px 10px;">
            <p>A student has logged a distressing mood entry.</p>
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:8px;font-weight:bold;">Student:</td><td>${userName}</td></tr>
              <tr><td style="padding:8px;font-weight:bold;">Email:</td><td>${userEmail}</td></tr>
              <tr><td style="padding:8px;font-weight:bold;">Mood:</td><td>${moodLabel}</td></tr>
              <tr><td style="padding:8px;font-weight:bold;">Note:</td><td>${note || 'No note added'}</td></tr>
              <tr><td style="padding:8px;font-weight:bold;">Risk Level:</td>
                <td><span style="color:${riskColor};font-weight:bold;">${riskLevel.toUpperCase()} (${Math.round(riskScore * 100)}%)</span></td>
              </tr>
              <tr><td style="padding:8px;font-weight:bold;">Time:</td><td>${new Date().toLocaleString()}</td></tr>
            </table>
            <p style="margin-top:20px;color:${riskColor};font-weight:bold;">
              Please consider reaching out to this student as soon as possible.
            </p>
            <p style="color:#888;font-size:12px;">Automated alert from MindSpace · Sentiment Analysis powered by HuggingFace BERT</p>
          </div>
        </div>
      `,
    });
    console.log(`✅ ${riskLevel} risk alert sent for ${userName}`);
  } catch (err) {
    console.error('❌ Email error:', err.message);
  }
};

// ── POST /api/mood/save ───────────────────────────────────────────────────────
router.post('/save', protect, async (req, res) => {
  try {
    const emoji   = sanitize(req.body.emoji   || '');
const label   = sanitize(req.body.label   || '');
const score   = Number(req.body.score);
const color   = sanitize(req.body.color   || '');
const note    = sanitize(req.body.note    || '').slice(0, 1000);
const dateKey = sanitize(req.body.dateKey || '');

    if (!emoji || !label || score === undefined || score === null || !dateKey)
      return res.status(400).json({ message: 'Missing required mood fields.' });

    // ✅ Run sentiment analysis on the note text
    const noteText  = note || '';
    const sentiment = await analyzeSentiment(noteText);

    // Also consider mood score: score=1 is inherently high risk
    let finalRiskLevel = sentiment.level;
    if (score === 1 && finalRiskLevel === 'low')   finalRiskLevel = 'medium';
    if (score === 1 && sentiment.score >= 0.5)     finalRiskLevel = 'high';

    // Save mood with sentiment data
    const mood = await Mood.findOneAndUpdate(
      { user: req.user._id, dateKey },
      {
        emoji, label, score, color,
        note:         noteText,
        riskLevel:    finalRiskLevel,
        sentimentScore: sentiment.score,
        loggedAt:     new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    // ── Update streak ─────────────────────────────────────────────────────────
    // BUG FIXES:
    // 1. req.user is the auth middleware snapshot — reload from DB so streak
    //    and lastLogDate are always current (not stale from login token).
    // 2. "yesterday" must be computed in LOCAL date arithmetic matching the
    //    dateKey format (YYYY-M-D), not UTC, so midnight rollovers don't
    //    cause an off-by-one that drops a streak day.
    // 3. If user logs AGAIN on the same day (update), keep the current streak
    //    unchanged — only increment when the PREVIOUS log was yesterday.

    const freshUser = await User.findById(req.user._id);
    const now       = new Date();
    const yest      = new Date(now);
    yest.setDate(yest.getDate() - 1);
    const yesterday = `${yest.getFullYear()}-${yest.getMonth()+1}-${yest.getDate()}`;

    let newStreak = freshUser.streak || 0;

    if (freshUser.lastLogDate === dateKey) {
      // Same-day re-log: keep streak exactly as-is
      newStreak = freshUser.streak;
    } else if (freshUser.lastLogDate === yesterday) {
      // Logged yesterday → extend streak
      newStreak = (freshUser.streak || 0) + 1;
    } else {
      // Gap of 2+ days → reset to 1 (today counts as day 1)
      newStreak = 1;
    }

    await User.findByIdAndUpdate(freshUser._id, { streak: newStreak, lastLogDate: dateKey });
    console.log(`🔥 Streak updated: ${freshUser.streak} → ${newStreak} (lastLog: ${freshUser.lastLogDate} → ${dateKey})`);

    // ── Send counselor alert for medium/high risk ─────────────────────────────
    const alertSent = finalRiskLevel === 'high';
    if (alertSent) {
      await sendCounselorAlert(
        freshUser.name, freshUser.email,
        label, noteText,
        finalRiskLevel, sentiment.score,
      );
    }

    res.json({
      message:    'Mood saved successfully!',
      mood,
      streak:     newStreak,
      alertSent,
      riskLevel:  finalRiskLevel,
      sentiment: {
        score:  sentiment.score,
        level:  finalRiskLevel,
        method: sentiment.method,
      },
    });
  } catch (err) {
    console.error('Mood save error:', err);
    res.status(500).json({ message: 'Server error saving mood.' });
  }
});

// ── GET /api/mood/history ─────────────────────────────────────────────────────
router.get('/history', protect, async (req, res) => {
  try {
    const moods = await Mood
      .find({ user: req.user._id })
      .sort({ loggedAt: -1 })
      .limit(30);
    res.json({ moods });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// ── GET /api/mood/today ───────────────────────────────────────────────────────
router.get('/today', protect, async (req, res) => {
  try {
    const d     = new Date();
    const today = `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
    const mood  = await Mood.findOne({ user: req.user._id, dateKey: today });
    res.json({ mood: mood || null });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});


// ── GET /api/mood/recalculate-streak ─────────────────────────────────────────
// Recalculates streak from actual mood history so users who had the bug
// get the correct streak without needing to re-log every day.
router.get('/recalculate-streak', protect, async (req, res) => {
  try {
    // Get all moods sorted oldest → newest
    const moods = await Mood
      .find({ user: req.user._id })
      .sort({ loggedAt: 1 });

    if (!moods.length) {

      await User.findByIdAndUpdate(req.user._id, { streak: 0, lastLogDate: '' });
      return res.json({ streak: 0, message: 'No moods found.' });
    }

    // Build a Set of unique dateKeys logged
   const loggedDays = [...new Set(moods.map(m => m.dateKey))].sort((a, b) => {
  const da = new Date(a.replace(/(\d+)-(\d+)-(\d+)/, '$1/$2/$3'));
  const db = new Date(b.replace(/(\d+)-(\d+)-(\d+)/, '$1/$2/$3'));
  return da - db;
});

   // Get today's date first
const now      = new Date();
const today    = `${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}`;
const yest     = new Date(now); yest.setDate(yest.getDate() - 1);
const yesterday= `${yest.getFullYear()}-${yest.getMonth()+1}-${yest.getDate()}`;

// Count consecutive days ending at the most recent log
let streak = loggedDays.includes(today) ? 1 : 0;
for (let i = loggedDays.length - 1; i > 0; i--) {
  const curr = new Date(loggedDays[i].replace(/(\d+)-(\d+)-(\d+)/, '$1/$2/$3'));
  const prev = new Date(loggedDays[i-1].replace(/(\d+)-(\d+)-(\d+)/, '$1/$2/$3'));
  const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
  if (diffDays === 1) {
    streak++;
  } else {
    break; // gap found — stop counting back
  }
}

const lastKey = loggedDays[loggedDays.length - 1];

 if (lastKey !== today && lastKey !== yesterday) {
  // Streak is broken — reset to 0
  streak = 0;
} else if (lastKey === today && streak === 0) {
  // Logged today but no consecutive days — still counts as 1
  streak = 1;
}

   console.log(`📊 Recalculate: today=${today}, lastKey=${lastKey}, streak=${streak}`);
    await User.findByIdAndUpdate(req.user._id, { streak, lastLogDate: lastKey });
    res.json({ streak, lastLogDate: lastKey, totalDaysLogged: loggedDays.length });
  } catch (err) {
    console.error('Streak recalculate error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
// ── POST /api/mood/detect — AI mood detection from free text ─────────────────
router.post('/detect', protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Text is required.' });
    const { detectMoodFromText } = require('../services/sentiment');
    const result = await detectMoodFromText(text.trim());
    res.json(result);
  } catch (err) {
    console.error('Mood detect error:', err);
    res.status(500).json({ message: 'Server error detecting mood.' });
  }
});
