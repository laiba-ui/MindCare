const express  = require('express');
const multer   = require('multer');
const FormData = require('form-data');
const fs       = require('fs');
const path     = require('path');
const os       = require('os');
const protect  = require('../middleware/auth');
const router   = express.Router();

// ── Multer: store with correct extension directly ─────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, os.tmpdir()),
  filename:    (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.m4a';
    cb(null, `audio_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
});

// ── POST /api/speech/transcribe ───────────────────────────────────────────────
router.post('/transcribe', protect, upload.single('audio'), async (req, res) => {
  const filePath = req.file?.path;

  try {
    if (!req.file || !filePath) {
      return res.status(400).json({ message: 'No audio file received.' });
    }

    console.log('🎤 Audio received:', {
      name: req.file.filename,
      size: req.file.size,
      path: filePath,
    });

    if (!process.env.GROQ_API_KEY) {
      return res.json({ transcript: '', fallback: true });
    }

    // Verify file exists and has content
    const stat = fs.statSync(filePath);
    if (stat.size === 0) {
      return res.status(400).json({ message: 'Audio file is empty.' });
    }

    // ── Build multipart form for Groq Whisper ────────────────────────────
    const form = new FormData();
    const ext  = path.extname(req.file.filename) || '.m4a';

    form.append('file', fs.createReadStream(filePath), {
      filename:    `audio${ext}`,
      contentType: 'audio/m4a',
      knownLength: stat.size,
    });
    form.append('model',           'whisper-large-v3-turbo');
    form.append('language',        'en');
    form.append('response_format', 'json');
    form.append('temperature',     '0');

    const formHeaders = form.getHeaders();
    const formLength  = await new Promise((resolve, reject) =>
      form.getLength((err, len) => err ? reject(err) : resolve(len))
    );

    const nodeFetch = await import('node-fetch').then(m => m.default);
const groqRes = await nodeFetch('https://api.groq.com/openai/v1/audio/transcriptions', {
  method:  'POST',
  headers: {
    'Authorization':  `Bearer ${process.env.GROQ_API_KEY}`,
    'Content-Length': String(formLength),
    ...formHeaders,
  },
  body: form,
});

    // Cleanup
    try { fs.unlinkSync(filePath); } catch (_) {}

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error('❌ Groq Whisper error:', groqRes.status, errText);
      return res.status(502).json({ message: 'Transcription service error.', groqError: errText });
    }

    const data       = await groqRes.json();
    const transcript = (data.text || '').trim();
    console.log('✅ Transcription:', transcript);
    res.json({ transcript });

  } catch (err) {
    if (filePath) try { fs.unlinkSync(filePath); } catch (_) {}
    console.error('❌ Speech transcribe error:', err.message);
    res.status(500).json({ message: 'Server error during transcription.' });
  }
});

module.exports = router;