from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
import json
import os
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import pickle

app = Flask(__name__)
CORS(app)

BASE = os.path.dirname(os.path.abspath(__file__))

print("Loading emotion model...")
emotion_model_path = os.path.join(BASE, 'emotion_model (1)', 'emotion_model')
emotion_tokenizer = AutoTokenizer.from_pretrained(emotion_model_path)
emotion_model = AutoModelForSequenceClassification.from_pretrained(emotion_model_path)
emotion_model.eval()

# Load label map for emotion
with open(os.path.join(emotion_model_path, 'label_map.json'), 'r') as f:
    label_map = json.load(f)
id_to_label = {int(k): v for k, v in label_map['id2label'].items()}

print("Loading suicide/risk model...")
suicide_model_path = os.path.join(BASE, 'roberta_suicide_best_model', 'content', 'roberta_suicide', 'best_model')
suicide_tokenizer = AutoTokenizer.from_pretrained(suicide_model_path)
suicide_model = AutoModelForSequenceClassification.from_pretrained(suicide_model_path)
suicide_model.eval()

# Load label encoder for suicide model
with open(os.path.join(suicide_model_path, 'label_encoder.pkl'), 'rb') as f:
    label_encoder = pickle.load(f)

print("✅ Both models loaded successfully!")

@app.route('/', methods=['GET'])
def health():
    return jsonify({'status': 'Model server running ✅'})

@app.route('/predict-mood', methods=['POST'])
def predict_mood():
    data = request.json
    text = data.get('text', '')
    if not text:
        return jsonify({'mood': 'Neutral'})
    inputs = emotion_tokenizer(text, return_tensors='pt', truncation=True, max_length=128)
    with torch.no_grad():
        outputs = emotion_model(**inputs)
    predicted_id = torch.argmax(outputs.logits, dim=1).item()
    mood = id_to_label.get(predicted_id, 'Neutral')
    return jsonify({'mood': mood})

@app.route('/predict-risk', methods=['POST'])
def predict_risk():
    data = request.json
    text = data.get('text', '')
    if not text:
        return jsonify({'risk': 'low', 'score': 0.1})
    inputs = suicide_tokenizer(text, return_tensors='pt', truncation=True, max_length=128)
    with torch.no_grad():
        outputs = suicide_model(**inputs)
    probs = torch.softmax(outputs.logits, dim=1)
    predicted_id = torch.argmax(probs, dim=1).item()
    score = probs[0][predicted_id].item()
    label = label_encoder.inverse_transform([predicted_id])[0]
    return jsonify({'risk': str(label), 'score': round(score, 4)})

if __name__ == '__main__':
    app.run(port=5001, debug=False)