from flask import Flask, request, jsonify
from flask_cors import CORS
from models.structured_predictor import predict_severity_from_vitals
from models.image_analyzer import analyze_wound_image
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for Node.js backend

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "service": "ML Severity Predictor"}), 200

# Predict severity from structured data (vitals + symptoms + age)
@app.route('/predict-severity', methods=['POST'])
def predict_severity():
    try:
        data = request.get_json()
        
        # Extract data
        vitals = data.get('vitals', {})
        symptoms = data.get('symptoms', [])
        age = data.get('age', 0)
        
        # Validate input
        if not vitals:
            return jsonify({"error": "Vitals data required"}), 400
        
        # Call prediction model
        score = predict_severity_from_vitals(vitals, symptoms, age)
        
        return jsonify({
            "success": True,
            "score": score,
            "severity": categorize_severity(score)
        }), 200
        
    except Exception as e:
        print(f"Error in predict_severity: {str(e)}")
        return jsonify({"error": str(e)}), 500

# Analyze wound image
@app.route('/analyze-wound', methods=['POST'])
def analyze_wound():
    try:
        # Check if image file is present
        if 'image' not in request.files:
            return jsonify({"error": "No image file provided"}), 400
        
        image_file = request.files['image']
        
        if image_file.filename == '':
            return jsonify({"error": "Empty filename"}), 400
        
        # Read image bytes
        image_bytes = image_file.read()
        
        # Call image analysis model
        result = analyze_wound_image(image_bytes)
        
        return jsonify({
            "success": True,
            "severity": result['severity'],
            "score": result['score'],
            "confidence": result.get('confidence', 0.8)
        }), 200
        
    except Exception as e:
        print(f"Error in analyze_wound: {str(e)}")
        return jsonify({"error": str(e)}), 500

# Helper function to categorize severity score
def categorize_severity(score):
    if score >= 76:
        return "Emergency"
    elif score >= 51:
        return "High"
    elif score >= 26:
        return "Medium"
    else:
        return "Low"

if __name__ == '__main__':
    print("🚀 Starting ML Severity Prediction Service...")
    print("📍 Running on http://localhost:5001")
    app.run(host='0.0.0.0', port=5001, debug=True)
