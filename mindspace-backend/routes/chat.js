// backend/routes/chat.js
// Real AI responses using Groq API (fast, free tier available)
// Model: llama3-8b-8192 — fast and good for conversational AI
// Sentiment analysis on each message → counselor alert if high risk

const express              = require('express');
const protect              = require('../middleware/auth');
const { analyzeSentiment } = require('../services/sentiment');
const nodemailer           = require('nodemailer');
const ChatMessage = require('../models/ChatMessage');
const router               = express.Router();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

const sendCounselorChatAlert = async (userName, userEmail, message, riskLevel) => {
  try {
    await transporter.sendMail({
      from:    `"MindSpace App" <${process.env.EMAIL_USER}>`,
      to:      process.env.COUNSELOR_EMAIL,
      subject: `⚠️ High Risk Chat Message — ${userName}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#C2185B;color:white;padding:20px;border-radius:10px 10px 0 0;">
            <h2>⚠️ MindSpace — High Risk Chat Alert</h2>
          </div>
          <div style="background:#f9f9f9;padding:20px;border-radius:0 0 10px 10px;">
            <p><strong>Student:</strong> ${userName}</p>
            <p><strong>Email:</strong> ${userEmail}</p>
            <p><strong>Message:</strong> "${message}"</p>
            <p><strong>Risk Level:</strong>
              <span style="color:#FF4D5A;font-weight:bold;">${riskLevel.toUpperCase()}</span>
            </p>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            <p style="color:#FF4D5A;font-weight:bold;margin-top:20px;">
              Please reach out to this student immediately.
            </p>
            <p style="color:#888;font-size:12px;">
              Automated alert from MindSpace · Sentiment Analysis by HuggingFace BERT
            </p>
          </div>
        </div>
      `,
    });
    console.log(`✅ Chat alert sent for ${userName} — risk: ${riskLevel}`);
  } catch (err) {
    console.error('❌ Chat alert email error:', err.message);
  }
};

// ── POST /api/chat/send ───────────────────────────────────────────────────────
router.post('/send', protect, async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message?.trim()) return res.status(400).json({ message: 'Message is required.' });

    // 1. Sentiment analysis on the user message
    const sentiment = await analyzeSentiment(message);
    const alertSent = sentiment.level === 'high';

    // 2. Get AI response from Groq
    let reply = '';

    if (process.env.GROQ_API_KEY) {
      try {
        // Build conversation history for context
        const conversationMessages = [
          {
            role:    'system',
            content: `You are Maia, a compassionate AI mental health companion for university students, a supportive mental health assistant. Be calm, kind, and helpful.
Your responses are based on CBT (Cognitive Behavioral Therapy) principles.
Guidelines:
- Keep responses warm, empathetic, and concise (2-4 sentences max)
- Never diagnose medical conditions
- If a student seems in crisis, gently encourage professional help
- Use a supportive, non-judgmental tone
- End responses with an open-ended question to continue the conversation
- Be culturally sensitive to Pakistani/South Asian students`,
          },
          // Include last 5 messages for context
          ...history.slice(-5).map((m) => ({
            role:    m.sender === 'user' ? 'user' : 'assistant',
            content: m.text,
          })),
          { role: 'user', content: message },
        ];

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method:  'POST',
          headers: {
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type':  'application/json',
          },
          body: JSON.stringify({
            model:       'llama-3.1-8b-instant', // fast Groq model
            messages:    conversationMessages,
            max_tokens:  250,
            temperature: 0.7,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          reply = data.choices?.[0]?.message?.content || '';
          console.log('✅ Groq response received');
        } else {
          const err = await response.text();
          console.error('❌ Groq API error:', err);
        }
      } catch (err) {
        console.error('❌ Groq fetch error:', err.message);
      }
    }

    // Fallback if Groq fails or key not set
    if (!reply) {
      const fallbacks = [
        "I hear you 💙 It takes courage to share how you're feeling. Can you tell me more about what's been on your mind?",
        "Thank you for opening up to me. It sounds like you're going through a tough time. What would feel most helpful right now?",
        "Your feelings are completely valid 🌱 Sometimes just talking about things can help. What's been the hardest part of your day?",
        "I'm here for you, and I want to understand better. How long have you been feeling this way?",
        "That sounds really challenging 💙 You're not alone in this. Have you been able to talk to anyone else about how you're feeling?",
      ];
      reply = fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }

    // 3. Send counselor alert if high risk detected
    if (alertSent) {
      await sendCounselorChatAlert(
        req.user.name,
        req.user.email,
        message,
        sentiment.level,
      );
    }

// Save both messages to MongoDB
await ChatMessage.create({
  userId: req.user._id,
  sender: 'user',
  text: message,
  riskLevel: sentiment.level,
  sentimentScore: sentiment.score,
});
await ChatMessage.create({
  userId: req.user._id,
  sender: 'maia',
  text: reply,
  riskLevel: 'low',
  sentimentScore: 0,
});

    res.json({
      reply,
      alertSent,
      sentiment: {
        level:  sentiment.level,
        score:  sentiment.score,
        method: sentiment.method,
      },
    });
  } catch (err) {
    console.error('Chat send error:', err);
    res.status(500).json({ message: 'Server error in chat.' });
  }
});

// ── GET /api/chat/history ─────────────────────────────────────────────────────
router.get('/history', protect, async (req, res) => {
  try {
    const messages = await ChatMessage.find({ userId: req.user._id })
      .sort({ createdAt: 1 })
      .limit(50);
    res.json({ messages });
  } catch (err) {
    console.error('Chat history error:', err);
    res.status(500).json({ message: 'Server error loading history.' });
  }
});

// ── DELETE /api/chat/history ──────────────────────────────────────────────────
router.delete('/history', protect, async (req, res) => {
  try {
    await ChatMessage.deleteMany({ userId: req.user._id });
    res.json({ message: 'Chat history cleared.' });
  } catch (err) {
    console.error('Chat clear error:', err);
    res.status(500).json({ message: 'Server error clearing history.' });
  }
});

module.exports = router;