const fs = require('fs');
const path = require('path');

let emotionPipeline = null;
let suicidePipeline = null;
let modelsLoaded = false;

const fallbackEmotionKeywords = [
  { emotion: 'sad', words: ['sad', 'depressed', 'hopeless', 'lonely', 'broken', 'cry', 'tears', 'hurt', 'worthless', 'miserable', 'empty', 'pain', 'unhappy'] },
  { emotion: 'fear', words: ['afraid', 'scared', 'terrified', 'panic', 'anxious', 'anxiety', 'nervous', 'worried', 'fearful', 'unsafe'] },
  { emotion: 'anger', words: ['angry', 'furious', 'mad', 'hate', 'annoyed', 'frustrated', 'irritated', 'rage'] },
  { emotion: 'joy', words: ['happy', 'joy', 'glad', 'good', 'excited', 'thankful', 'grateful', 'relieved', 'positive', 'content'] },
  { emotion: 'love', words: ['love', 'loving', 'cherish', 'care', 'kind'] },
];

const inferFallbackEmotion = (text) => {
  const lower = text.toLowerCase();
  for (const item of fallbackEmotionKeywords) {
    if (item.words.some((word) => lower.includes(word))) {
      return item.emotion;
    }
  }
  return 'neutral';
};

const hasOnnxModel = (modelDir) => {
  const onnxFile = path.join(modelDir, 'onnx', 'model_quantized.onnx');
  return fs.existsSync(onnxFile);
};

const isValidClassificationModel = (pipelineInstance) => {
  if (!pipelineInstance || !pipelineInstance.model || !pipelineInstance.model.config) {
    return false;
  }

  const config = pipelineInstance.model.config;
  const problemType = config.problem_type;
  const architectures = config.architectures || [];

  if (problemType === 'single_label_classification' || problemType === 'multi_label_classification') {
    return true;
  }

  return architectures.some((arch) => /SequenceClassification|ForSequenceClassification/i.test(arch));
};

// ── Lazy-load models ─────────────────────────────────────────────────────────
const initializeModels = async () => {
  if (modelsLoaded) return;

  console.log('🤖 Initializing ML models...');

  try {
    const { pipeline, env } = await import('@xenova/transformers');

    const modelRoot = path.resolve(__dirname, '../ml-models');
    const toPosixPath = (targetPath) => path.resolve(targetPath).replace(/\\/g, '/');
    env.allowRemoteModels = false;
    env.localModelPath = toPosixPath(modelRoot);

    const emotionModelPath = path.join(modelRoot, 'emotion_model');
    const suicideModelPath = path.join(modelRoot, 'suicide-model', 'Xenova', 'roberta-base');

    if (hasOnnxModel(emotionModelPath)) {
      try {
        const candidate = await pipeline('text-classification', 'emotion_model', { local_files_only: true });
        if (isValidClassificationModel(candidate)) {
          emotionPipeline = candidate;
          console.log('✅ Emotion model loaded');
        } else {
          console.warn('⚠️ Emotion model loaded but is not a valid text-classification model. Falling back to rule-based emotion detection.');
        }
      } catch (err) {
        console.warn('⚠️ Failed to load emotion model from local path:', err.message);
        emotionPipeline = null;
      }
    } else {
      console.warn('⚠️ Emotion model ONNX files not found in local emotion_model folder. Using fallback emotion rules.');
    }

    if (hasOnnxModel(suicideModelPath)) {
      try {
        const candidate = await pipeline('text-classification', 'suicide-model/Xenova/roberta-base', { local_files_only: true });
        if (isValidClassificationModel(candidate)) {
          suicidePipeline = candidate;
          console.log('✅ Suicide detection model loaded');
        } else {
          console.warn('⚠️ Suicide model loaded but is not a valid text-classification model. Falling back to keyword suicide detection.');
        }
      } catch (err) {
        console.warn('⚠️ Failed to load suicide detection model from local path:', err.message);
        suicidePipeline = null;
      }
    } else {
      console.warn('⚠️ Suicide model ONNX files not found in local suicide-model folder.');
    }

    const hasAnyLocalModel = !!emotionPipeline || !!suicidePipeline;
    if (!hasAnyLocalModel) {
      console.warn('⚠️ No local models were loaded. Sentiment analysis will use fallback heuristics.');
    }
    modelsLoaded = true;
  } catch (error) {
    console.error('❌ Error initializing models:', error.message);
    modelsLoaded = true;
  }
};

// ── Emotion Detection ────────────────────────────────────────────────────────
const detectEmotion = async (text) => {
  if (!text || text.trim().length < 3) {
    return { emotion: 'neutral', score: 0.1, source: 'empty' };
  }

  try {
    await initializeModels();

    if (!emotionPipeline) {
      const emotion = inferFallbackEmotion(text);
      const score = emotion === 'neutral' ? 0.5 : 0.75;
      return {
        emotion,
        score,
        source: 'fallback-rule-based',
        confidence: Math.round(score * 100),
        allResults: [{ label: emotion, score }],
      };
    }

    // Run emotion classification
    const results = await emotionPipeline(text, { top_k: 1 });

    if (results && results.length > 0) {
      const emotion = results[0].label.toLowerCase();
      const score = results[0].score;

      return {
        emotion,
        score: parseFloat(score.toFixed(4)),
        source: 'fine-tuned-emotion-model',
        confidence: Math.round(score * 100),
        allResults: results.slice(0, 3), // Top 3 emotions
      };
    }

    return { emotion: 'neutral', score: 0.5, source: 'error' };
  } catch (error) {
    console.error('Emotion detection error:', error.message);
    const emotion = inferFallbackEmotion(text);
    const score = emotion === 'neutral' ? 0.5 : 0.75;
    return {
      emotion,
      score,
      source: 'fallback-error',
      confidence: Math.round(score * 100),
      error: error.message,
    };
  }
};

// ── Suicide Risk Detection ──────────────────────────────────────────────────
const detectSuicideRisk = async (text) => {
  if (!text || text.trim().length < 3) {
    return { 
      riskLevel: 'low', 
      score: 0.1, 
      source: 'empty',
      isHighRisk: false
    };
  }

  try {
    await initializeModels();

    if (!suicidePipeline) {
      const lower = text.toLowerCase();
      const mediumRiskWords = [
        'depressed', 'depression', 'anxious', 'anxiety', 'panic attack',
        "can't sleep", 'not eating', 'crying all day', 'feel empty',
        'exhausted', 'breaking down', 'overwhelmed', 'stressed out',
        'hopeless', 'worthless', 'feel numb', 'feeling numb', 'empty inside',
        'no one cares', 'nobody cares', 'all alone', 'lost hope', "can't cope",
        'cannot cope', 'falling apart', 'mental breakdown', 'losing my mind',
        'going crazy', 'tired of living', 'done with life', 'give up on life'
      ];
      const matched = mediumRiskWords.some((word) => lower.includes(word));
      return {
        isHighRisk: false,
        riskLevel: matched ? 'medium' : 'low',
        score: matched ? 0.5 : 0.2,
        source: 'fallback-no-suicide-model'
      };
    }

    // Run suicide risk classification
    const results = await suicidePipeline(text, {
      top_k: 1
    });

    if (results && results.length > 0 && results[0]?.label != null && typeof results[0]?.score === 'number') {
      const label = results[0].label.toLowerCase();
      const score = results[0].score;

      // Determine risk level based on score
      let riskLevel = 'low';
      let finalScore = score;

      if (label === 'suicide') {
        if (score >= 0.85) riskLevel = 'high';
        else if (score >= 0.60) riskLevel = 'medium';
        else riskLevel = 'low';
        finalScore = score;
      } else {
        riskLevel = 'low';
        finalScore = 1 - score;
      }

      return {
        isHighRisk: riskLevel === 'high',
        riskLevel,
        score: parseFloat(finalScore.toFixed(4)),
        source: 'fine-tuned-roberta-model',
        confidence: Math.round(score * 100),
        prediction: label,
        allResults: results.slice(0, 2)
      };
    }

    return {
      isHighRisk: false,
      riskLevel: 'low',
      score: 0.5,
      source: 'error'
    };
  } catch (error) {
    console.error('Suicide detection error:', error.message);
    return {
      isHighRisk: false,
      riskLevel: 'low',
      score: 0,
      source: 'error',
      error: error.message
    };
  }
};
// ── Enhanced Sentiment Analysis (combining both models) ──────────────────────
const analyzeSentimentWithModels = async (text) => {
  try {
    // Get both emotion and suicide risk
    const emotionResult = await detectEmotion(text);
    const suicideResult = await detectSuicideRisk(text);

    // Map emotion to sentiment score
    const emotionToScore = {
      'anger': 0.7,
      'fear': 0.75,
      'sad': 0.80,
      'suprise': 0.45,
      'love': 0.2,
      'joy': 0.1,
      'neutral': 0.5,
      'unknown': 0.5
    };

    const sentimentScore = emotionToScore[emotionResult.emotion] || 0.5;

    // Combine results
    let finalRiskLevel = suicideResult.riskLevel;

    // Enhance risk level based on emotion
    if (emotionResult.emotion === 'sad' && emotionResult.score > 0.7) {
      if (finalRiskLevel === 'low') finalRiskLevel = 'medium';
    }

    return {
      level: finalRiskLevel,
      score: suicideResult.score,
      sentiment: sentimentScore,
      emotion: emotionResult.emotion,
      emotionScore: emotionResult.score,
      method: 'fine-tuned-models',
      details: {
        emotion: emotionResult,
        suicide: suicideResult
      }
    };
  } catch (error) {
    console.error('Enhanced sentiment analysis error:', error.message);
    return {
      level: 'low',
      score: 0,
      method: 'error',
      error: error.message
    };
  }
};

// ── Mood Label Mapping from Emotion ─────────────────────────────────────────
const emotionToMood = (emotion) => {
  const mapping = {
    'anger': { mood: 'Angry', emoji: '😡', score: 1 },
    'fear': { mood: 'Anxious', emoji: '😰', score: 2 },
    'sad': { mood: 'Sad', emoji: '😔', score: 2 },
    'suprise': { mood: 'Excited', emoji: '🤩', score: 5 },
    'love': { mood: 'Happy', emoji: '😄', score: 4 },
    'joy': { mood: 'Happy', emoji: '😄', score: 4 },
    'neutral': { mood: 'Okay', emoji: '🙂', score: 3 },
  };

  return mapping[emotion.toLowerCase()] || { mood: 'Neutral', emoji: '😐', score: 3 };
};

module.exports = {
  initializeModels,
  detectEmotion,
  detectSuicideRisk,
  analyzeSentimentWithModels,
  emotionToMood
};
