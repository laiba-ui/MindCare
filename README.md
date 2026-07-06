# 🧠 MindCare — Student Mental Health Tracker & AI Assistant

<div align="center">

![MindCare Banner](https://img.shields.io/badge/MindCare-Mental%20Health%20App-6C63FF?style=for-the-badge&logo=react&logoColor=white)
![React Native](https://img.shields.io/badge/React%20Native-Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Python](https://img.shields.io/badge/Python-Flask-3776AB?style=for-the-badge&logo=python&logoColor=white)

**A Final Year Project — International Islamic University Islamabad (IIUI)**
**Department of Computer Science & Information Technology**

*Developed by Laiba Fawad, Asifa Batool & Ansa Sajid | Supervised by Sana Khattak*

</div>

---

## 📖 Overview

**MindCare** is a cross-platform mobile application designed to support university students' mental health through AI-powered mood tracking, an empathetic AI companion (Maia), real-time crisis detection, and a counselor alert system. The app combines state-of-the-art natural language processing with a user-friendly interface to make mental health support accessible to every student.

---

## ✨ Key Features

### 🎭 AI-Powered Mood Tracking
- Detects mood automatically from journal text using a **fine-tuned emotion classification model**
- Tracks daily mood history with streak system
- Visualizes weekly mood trends with interactive charts
- Sends automated counselor alerts for high-risk entries

### 💬 AI Chat Assistant (Maia)
- Empathetic AI companion powered by **Groq LLaMA3** (llama-3.1-8b-instant)
- Supports **voice input** via Groq Whisper transcription
- Maintains full conversation history across sessions
- Responds based on CBT (Cognitive Behavioral Therapy) principles
- Culturally sensitive responses for Pakistani/South Asian students

### ⚠️ Crisis Detection & Counselor Alert System
- **3-layer sentiment analysis pipeline:**
  1. Keyword-based fast check (instant)
  2. Fine-tuned RoBERTa suicide detection model (99.7% accuracy)
  3. Fallback heuristic word analysis
- Automated email alerts to university counselor for high-risk messages
- Crisis resource display with emergency contacts

### 🏆 Gamification & Engagement
- Daily streak tracking with streak recovery system
- Achievement badges (unlocked based on real usage data)
- Micro-goals system for daily wellness tasks
- Progress dashboard with mood analytics

### 🔐 Authentication & Security
- JWT-based secure authentication
- bcrypt password hashing
- OTP-based forgot password via email
- Protected API routes with middleware

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React Native (Expo SDK 54) | Cross-platform mobile app |
| Expo Router | File-system based navigation |
| React Native Reanimated | Smooth animations |
| Expo AV | Audio recording for voice input |
| Expo Speech | Text-to-speech output |
| AsyncStorage | Local session persistence |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express.js | REST API server |
| MongoDB + Mongoose | Database & ODM |
| JWT + bcryptjs | Authentication & security |
| Nodemailer | Counselor email alerts |
| Multer | Audio file upload handling |

### AI & ML
| Technology | Purpose |
|---|---|
| Groq API (LLaMA3) | AI chat responses |
| Groq Whisper | Voice-to-text transcription |
| Hugging Face DistilBERT | Sentiment analysis |
| Fine-tuned Emotion Model | Mood detection from text |
| Fine-tuned RoBERTa Model | Suicide/crisis risk detection |
| Python Flask | ML model serving API |

---

## 🤖 Fine-Tuned Models

MindCare uses two custom fine-tuned transformer models trained on mental health datasets:

### 1. Emotion Detection Model
- **Base Model:** DistilBERT
- **Labels:** anger, fear, joy, love, sad, surprise
- **Use:** Automatically detects user's mood from journal text
- **Accuracy:** Validated on mental health text datasets

### 2. Suicide Risk Detection Model
- **Base Model:** RoBERTa
- **Labels:** suicide, non-suicide
- **Use:** Real-time crisis detection in chat and mood notes
- **Accuracy:** 99.7% on held-out test set

---

## 📁 Project Structure

```
MindCare/
├── mindcare/                    # React Native Frontend (Expo)
│   ├── app/
│   │   ├── (auth)/             # Login, Signup, Forgot Password
│   │   ├── (tabs)/             # Main app tabs
│   │   │   ├── index.tsx       # Home Dashboard
│   │   │   ├── MoodTracker.tsx # Mood logging screen
│   │   │   ├── ai.tsx          # AI Chat (Maia)
│   │   │   ├── profile.tsx     # User profile
│   │   │   └── ...
│   │   ├── achievements.tsx    # Achievements screen
│   │   ├── progress.tsx        # Progress & analytics
│   │   ├── micro-goals.tsx     # Daily micro-goals
│   │   └── utils/
│   │       └── api.ts          # API client with auto IP detection
│   └── components/             # Reusable UI components
│
└── mindspace-backend/           # Node.js Backend
    ├── routes/
    │   ├── auth.js             # Register, Login, OTP Password Reset
    │   ├── mood.js             # Mood CRUD + streak calculation
    │   ├── chat.js             # AI chat + history
    │   ├── profile.js          # User profile management
    │   └── speech.js           # Voice transcription
    ├── models/
    │   ├── User.js             # User schema
    │   ├── Mood.js             # Mood entry schema
    │   └── ChatMessage.js      # Chat history schema
    ├── services/
    │   └── sentiment.js        # 3-layer sentiment analysis pipeline
    ├── middleware/
    │   └── auth.js             # JWT authentication middleware
    └── model_server.py         # Python Flask server for ML models
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- Python 3.10+
- MongoDB Atlas account
- Expo Go app (for development)
- Groq API key (free at console.groq.com)
- Hugging Face API key (free at huggingface.co)

### 1. Clone the Repository
```bash
git clone https://github.com/laiba-ui/MindCare.git
cd MindCare
```

### 2. Set Up Backend
```bash
cd mindspace-backend
npm install
```

Create `.env` file:
```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
PORT=5000
GROQ_API_KEY=your_groq_api_key
HF_API_KEY=your_huggingface_api_key
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
COUNSELOR_EMAIL=counselor@university.edu
PYTHON_MODEL_URL=http://localhost:5001
```

### 3. Set Up Python Model Server
```bash
cd mindspace-backend
pip install flask flask-cors torch transformers pickle5
python model_server.py
```

> ⚠️ Note: Fine-tuned model files (.safetensors) are not included in this repository due to file size limits. Contact the developers to obtain the model files.

### 4. Set Up Frontend
```bash
cd mindcare
npm install
npx expo start
```

### 5. Run the App
Start all three servers in separate terminals:

```bash
# Terminal 1 — Python ML Model Server
cd mindspace-backend && python model_server.py

# Terminal 2 — Node.js Backend
cd mindspace-backend && node server.js

# Terminal 3 — React Native Frontend
cd mindcare && npx expo start
```

Scan the QR code with **Expo Go** on your Android/iOS device.

---

## 📱 App Screenshots

> *Screenshots and demo video available upon request*

---

## 🔮 Future Enhancements

- [ ] Deploy backend to cloud (Railway/Render)
- [ ] Google OAuth login
- [ ] iOS App Store & Google Play Store release
- [ ] Multilingual support (Urdu/Arabic)
- [ ] Push notifications for daily mood reminders
- [ ] Admin dashboard for counselors
- [ ] Offline mood logging with sync

---

## 👥 Team

| Name | Role | Student ID |
|---|---|---|
| Laiba Fawad | Full Stack Developer & Backend  | [4645-foc/bscs/f22] |
| Asifa Batool| ML Engineer & Model Fine-Tuning | [4669-foc/bscs/f22] |
| Ansa Sajid  | Frontend & Documentation        | [4720-foc/bscs/f22] |

**Supervisor:** Sana Khattak
**Institution:** International Islamic University, Islamabad (IIUI)
**Department:** Computer Science & Information Technology
**Degree:** BS Computer Science
**Year:** 2022-2026

---

## 📄 License

This project was developed as a Final Year Project at IIUI. All rights reserved.

---

<div align="center">
Made with ❤️ for student mental health awareness
</div>
