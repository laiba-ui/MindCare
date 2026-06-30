// backend/server.js
require('dotenv').config();
const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const dns=require("dns");
dns.setServers([
  '1.1.1.1',
  '8.8.8.8'
])

const authRoutes     = require('./routes/auth');
const moodRoutes     = require('./routes/mood');
const profileRoutes  = require('./routes/profile');
const feedbackRoutes = require('./routes/feedback');
const chatRoutes     = require('./routes/chat'); // ✅ NEW
const speechRoutes   = require('./routes/speech'); // ✅ Voice transcription

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: '*', methods: ['GET','POST','PUT','DELETE'] }));
app.use(express.json());

app.use('/api/auth',     authRoutes);
app.use('/api/mood',     moodRoutes);
app.use('/api/profile',  profileRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/chat',     chatRoutes); // ✅ NEW
app.use('/api/speech',   speechRoutes); // ✅ Voice transcription

app.get('/', (req, res) => res.json({ message: 'MindSpace API running ✅' }));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
  })
  .catch(err => console.error('❌ MongoDB error:', err));