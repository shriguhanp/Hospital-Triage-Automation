/**
 * ML Service Integration
 * Communicates with Python Flask ML service for severity predictions
 */

import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

/**
 * Predict severity from structured data (vitals + symptoms + age)
 * @param {Object} vitals - {systolicBP, diastolicBP, spo2, heartRate, temperature}
 * @param {Array} symptoms - Array of symptom strings
 * @param {Number} age - Patient age
 * @returns {Promise<Number>} - Severity score (0-100)
 */
export const predictSeverity = async (vitals, symptoms, age) => {
    try {
        const response = await axios.post(`${ML_SERVICE_URL}/predict-severity`, {
            vitals,
            symptoms,
            age
        }, {
            timeout: 10000 // 10 second timeout
        });

        if (response.data.success) {
            return response.data.score;
        } else {
            throw new Error('ML service returned unsuccessful response');
        }
    } catch (error) {
        console.error('Error calling ML predict-severity:', error.message);

        // Fallback to rule-based scoring if ML service is down
        return fallbackSeverityScore(vitals, symptoms, age);
    }
};

/**
 * Analyze wound image for severity
 * @param {String} imagePath - Path to wound image file
 * @returns {Promise<Object>} - {severity: string, score: number}
 */
import Groq from 'groq-sdk';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Initialize Groq client
const groq = new Groq({
    apiKey: GROQ_API_KEY
});

// Helper to encode image to base64
const encodeImage = (imagePath) => {
    try {
        const imageBuffer = fs.readFileSync(imagePath);
        return imageBuffer.toString('base64');
    } catch (error) {
        console.error('Error encoding image:', error);
        return null;
    }
};

/**
 * Analyze wound image for severity using Groq Vision
 * @param {String} imagePath - Path to wound image file
 * @returns {Promise<Object>} - {severity: string, score: number, analysis: string}
 */
export const analyzeWound = async (imagePath) => {
    try {
        if (!GROQ_API_KEY) {
            console.warn('GROQ_API_KEY not found, using fallback for wound analysis');
            throw new Error('GROQ_API_KEY missing');
        }

        // Check if file exists
        if (!fs.existsSync(imagePath)) {
            throw new Error(`Image file not found: ${imagePath}`);
        }

        // Encode image to base64
        const base64Image = encodeImage(imagePath);
        if (!base64Image) {
            throw new Error('Failed to encode image');
        }

        const dataUrl = `data:image/jpeg;base64,${base64Image}`;

        console.log('Analyzing wound image with Groq (llama-3.2-11b-vision-preview)...');

        const chatCompletion = await groq.chat.completions.create({
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "Analyze this wound image. Is it severe? Provide a severity score from 0-100 (where 100 is critical/emergency) and a severity level (Low, Medium, High, Emergency). Return ONLY valid JSON in this format: { \"score\": number, \"severity\": \"string\", \"explanation\": \"string\" }"
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": dataUrl
                            }
                        }
                    ]
                }
            ],
            "model": "llama-3.2-11b-vision-preview",
            "temperature": 0.1,
            "max_completion_tokens": 1024,
            "top_p": 1,
            "stream": false,
            "stop": null,
            "response_format": { "type": "json_object" }
        });

        const result = JSON.parse(chatCompletion.choices[0].message.content);

        console.log('Groq Analysis Result:', result);

        return {
            severity: result.severity || 'Medium',
            score: result.score || 50,
            explanation: result.explanation || 'AI analysis completed'
        };

    } catch (error) {
        console.error('Error calling Groq analyze-wound:', error.message);

        // Fallback to default score
        return {
            severity: 'Medium',
            score: 50,
            explanation: 'AI analysis unavailable, using default assessment.'
        };
    }
};

/**
 * Calculate final severity score (weighted average)
 * @param {Number} structuredScore - Score from vitals/symptoms (0-100)
 * @param {Number} imageScore - Score from wound image (0-100)
 * @returns {Number} - Final weighted score (0-100)
 */
export const calculateFinalSeverity = (structuredScore, imageScore) => {
    // If no image score, use only structured score
    if (!imageScore || imageScore === 0) {
        return Math.round(structuredScore);
    }

    // Weighted average: 60% structured, 40% image
    const finalScore = (0.6 * structuredScore) + (0.4 * imageScore);
    return Math.round(finalScore);
};

/**
 * Fallback severity scoring (rule-based) if ML service is unavailable
 * @param {Object} vitals
 * @param {Array} symptoms
 * @param {Number} age
 * @returns {Number} - Severity score (0-100)
 */
const fallbackSeverityScore = (vitals, symptoms, age) => {
    console.log('⚠️ Using fallback severity scoring (ML service unavailable)');

    let score = 0;

    // Vitals scoring
    const { systolicBP, diastolicBP, spo2, heartRate, temperature } = vitals;

    // Blood Pressure
    if (systolicBP > 180 || diastolicBP > 120) score += 25;
    else if (systolicBP > 140 || diastolicBP > 90) score += 15;
    else if (systolicBP < 90 || diastolicBP < 60) score += 20;

    // SpO2
    if (spo2 < 90) score += 30;
    else if (spo2 < 95) score += 15;

    // Heart Rate
    if (heartRate > 120 || heartRate < 50) score += 15;
    else if (heartRate > 100) score += 8;

    // Temperature
    if (temperature > 103) score += 15;
    else if (temperature > 100.4) score += 10;
    else if (temperature < 95) score += 20;

    // Symptoms scoring
    const criticalSymptoms = ['chest pain', 'severe bleeding', 'difficulty breathing', 'unconsciousness'];
    const hasCritical = symptoms.some(s => criticalSymptoms.some(cs => s.toLowerCase().includes(cs)));

    if (hasCritical) {
        score += 40;
    } else {
        score += Math.min(symptoms.length * 5, 20);
    }

    // Age factor
    if (age < 1) score += 10;
    else if (age < 12) score += 8;
    else if (age >= 75) score += 10;
    else if (age >= 65) score += 5;

    return Math.min(score, 100);
};

/**
 * Check if ML service is healthy
 * @returns {Promise<Boolean>}
 */
export const checkMLServiceHealth = async () => {
    try {
        const response = await axios.get(`${ML_SERVICE_URL}/health`, { timeout: 3000 });
        return response.data.status === 'ok';
    } catch (error) {
        console.error('ML service health check failed:', error.message);
        return false;
    }
};

export default {
    predictSeverity,
    analyzeWound,
    calculateFinalSeverity,
    checkMLServiceHealth
};
