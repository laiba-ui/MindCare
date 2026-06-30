const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const PYTHON_MODEL_URL = process.env.PYTHON_MODEL_URL || 'http://localhost:5001';

const detectEmotion = async (text) => {
  try {
    const res = await fetch(`${PYTHON_MODEL_URL}/predict-mood`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    return data.mood || 'neutral';
  } catch (err) {
    console.log('⚠️ Emotion model unavailable, using fallback');
    return 'neutral';
  }
};

const detectSuicideRisk = async (text) => {
  try {
    const res = await fetch(`${PYTHON_MODEL_URL}/predict-risk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    return { risk: data.risk, score: data.score };
  } catch (err) {
    console.log('⚠️ Risk model unavailable, using fallback');
    return { risk: 'non-suicide', score: 0.1 };
  }
};

const emotionToMood = (emotion) => {
  const map = {
    'joy': 'Happy',
    'love': 'Happy',
    'surprise': 'Excited',
    'suprise': 'Excited',
    'anger': 'Angry',
    'fear': 'Anxious',
    'sad': 'Sad',
    'neutral': 'Neutral',
  };
  return map[emotion?.toLowerCase()] || 'Neutral';
};

const HIGH_RISK_KEYWORDS = [
  'suicide', 'suicidal', 'kill myself', 'end my life', 'take my life',
  'want to die', 'wanna die', 'wish i was dead', 'wish i were dead',
  'rather be dead', 'end it all', 'end it', 'better off dead',
  'better off without me', 'nobody will miss me', 'no one will miss me',
  'world is better without me',
  'hurt myself', 'harm myself', 'self harm', 'self-harm',
  'cut myself', 'cutting myself', 'slit my wrists',
  'overdose', 'hang myself', 'jump off', 'jump from a', 'shoot myself',
  'pills to die', 'die tonight', 'die today', 'planning to die',
  'no reason to live', 'nothing to live for', 'not worth living',
  "life is not worth", "can't go on", "cannot go on", 'give up on life',
  'done with life', 'tired of living', 'living is too hard',
  'done with everything', 'i give up', 'ready to give up',
  'goodbye forever', 'last message', 'last time talking',
  ' die ', 'i want to die', 'i wanna die', 'let me die', 'please let me die',
  'going to die', "i'm going to die", "i am going to die",
  "don't want to be here", "do not want to be here", "dont want to be here",
  "don't want to exist", "do not want to exist",
  "want to disappear", "need to disappear", "want to vanish",
  'marna chahta', 'marna chahti', 'khud ko khatam', 'zindagi khatam',
];

const MEDIUM_RISK_KEYWORDS = [
  'depressed', 'depression', 'anxious', 'anxiety', 'panic attack',
  "can't sleep", 'not eating', 'crying all day', 'feel empty',
  'exhausted', 'breaking down', 'overwhelmed', 'stressed out',
  'failing', 'hate myself', 'nobody understands', 'hopeless', 'worthless',
  'feel numb', 'feeling numb', 'empty inside', 'no one cares',
  'nobody cares', 'all alone', 'completely alone', 'so alone',
  'lost hope', "can't cope", 'cannot cope', 'falling apart',
  'mental breakdown', 'losing my mind', 'going crazy',
];

// ── Keyword risk check ────────────────────────────────────────────────────────
const keywordRisk = (text) => {
  const lower = text.toLowerCase();
  if (HIGH_RISK_KEYWORDS.some(k => lower.includes(k)))   return { level: 'high',   score: 0.95 };
  if (MEDIUM_RISK_KEYWORDS.some(k => lower.includes(k))) return { level: 'medium', score: 0.60 };
  return null;
};

// ── Main sentiment analysis ───────────────────────────────────────────────────
const analyzeSentiment = async (text) => {
  if (!text || text.trim().length < 3) {
    return { level: 'low', score: 0.1, method: 'empty' };
  }

  // 1. Fast keyword check first (for obvious high-risk cases)
  const keywordResult = keywordRisk(text);
  if (keywordResult && keywordResult.level === 'high') {
    return { ...keywordResult, method: 'keyword-fast-check' };
  }

 // 2. Use fine-tuned suicide detection model
  try {
    const suicideResult = await detectSuicideRisk(text);
    
    // suicideResult returns { risk: 'suicide'/'non-suicide', score: 0.97 }
    if (suicideResult.risk === 'suicide' && suicideResult.score > 0.92) {
  return {
    level: 'high',
        score: suicideResult.score,
        method: 'fine-tuned-suicide-model',
        details: suicideResult
      };
    }

   if (suicideResult.risk === 'suicide' && suicideResult.score > 0.75) {
  return {
    level: 'medium',
        score: suicideResult.score,
        method: 'fine-tuned-suicide-model',
        details: suicideResult
      };
    }

    // If no medium/high risk from model, check sentiment
    const emotionResult = await detectEmotion(text);
    
    // emotionResult returns a string like 'sad', 'fear', 'anger'
    const negativeEmotions = ['sad', 'fear', 'anger'];
    if (negativeEmotions.includes(emotionResult) && keywordResult) {
      return {
        level: 'medium',
        score: 0.6,
        method: 'fine-tuned-emotion-model',
        details: emotionResult
      };
    }

    return {
      level: 'low',
      score: 0.2,
      method: 'fine-tuned-models',
      details: { emotion: emotionResult, suicide: suicideResult }
    };
  } catch (error) {
    console.error('Model-based analysis failed:', error.message);
    // Fall back to keyword analysis
    const count = HIGH_RISK_KEYWORDS.filter(k => text.toLowerCase().includes(k)).length;
    const score = Math.min(count * 0.15, 0.75);
    const level = score >= 0.45 ? 'medium' : 'low';
    return { level, score, method: 'fallback-keyword' };
  }
};

// ── Mood label from text (used by /mood/detect endpoint) ─────────────────────
const detectMoodFromText = async (text) => {
  if (!text || text.trim().length < 3) {
    return { mood: 'Neutral', emoji: '😐', score: 3, riskLevel: 'low', source: 'empty' };
  }

  try {
    // Check crisis first with keywords
    const risk = keywordRisk(text);
    if (risk && risk.level === 'high') {
      return { mood: 'Sad', emoji: '😢', score: 1, riskLevel: 'high', source: 'keyword-crisis' };
    }

    // Use fine-tuned emotion model for mood detection
    const emotionResult = await detectEmotion(text);
    const moodMapping = emotionToMood(emotionResult.emotion);

    // Get risk level from sentiment analysis
    const sentiment = await analyzeSentiment(text);

    return {
      mood: moodMapping.mood,
      emoji: moodMapping.emoji,
      score: moodMapping.score,
      riskLevel: sentiment.level,
      source: 'fine-tuned-emotion-model',
      emotion: emotionResult.emotion,
      confidence: emotionResult.confidence,
      details: {
        emotion: emotionResult,
        sentiment: sentiment
      }
    };
  } catch (error) {
    console.error('Mood detection error:', error.message);
    
    // Fallback: Use simple sentiment analysis
    const sentiment = await analyzeSentiment(text);
    if (sentiment.score >= 0.7) return { mood: 'Sad',     emoji: '😔', score: 2, riskLevel: sentiment.level, source: 'fallback' };
    if (sentiment.score >= 0.4) return { mood: 'Okay',    emoji: '🙂', score: 3, riskLevel: 'low', source: 'fallback' };
    return                             { mood: 'Neutral',  emoji: '😐', score: 3, riskLevel: 'low', source: 'fallback' };
  }
};

module.exports = { analyzeSentiment, detectMoodFromText };