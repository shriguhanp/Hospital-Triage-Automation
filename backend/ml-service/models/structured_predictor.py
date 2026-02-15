"""
Structured Data Severity Predictor
Rule-based logic to predict severity score (0-100) from patient vitals, symptoms, and age
This is a placeholder for actual ML model (RandomForest/XGBoost)
"""

# Critical symptoms that significantly increase severity
CRITICAL_SYMPTOMS = [
    'chest pain',
    'severe bleeding',
    'difficulty breathing',
    'unconsciousness',
    'seizure',
    'severe burns',
    'stroke symptoms',
    'heart attack symptoms'
]

# Concerning symptoms that moderately increase severity
CONCERNING_SYMPTOMS = [
    'fever',
    'persistent vomiting',
    'severe headache',
    'severe abdominal pain',
    'confusion',
    'severe pain',
    'dizziness',
    'loss of consciousness'
]

def predict_severity_from_vitals(vitals, symptoms, age):
    """
    Calculate severity score based on vitals, symptoms, and age
    
    Args:
        vitals (dict): {systolicBP, diastolicBP, spo2, heartRate, temperature}
        symptoms (list): List of symptom strings
        age (int): Patient age in years
    
    Returns:
        int: Severity score (0-100)
    """
    score = 0
    
    # 1. Vital Signs Analysis (0-50 points)
    
    # Blood Pressure
    systolic = vitals.get('systolicBP', 120)
    diastolic = vitals.get('diastolicBP', 80)
    
    if systolic > 180 or diastolic > 120:
        score += 25  # Hypertensive crisis
    elif systolic > 140 or diastolic > 90:
        score += 15  # High BP
    elif systolic < 90 or diastolic < 60:
        score += 20  # Low BP (hypotension)
    
    # SpO2 (Oxygen Saturation)
    spo2 = vitals.get('spo2', 98)
    if spo2 < 90:
        score += 30  # Critical low oxygen
    elif spo2 < 95:
        score += 15  # Low oxygen
    
    # Heart Rate
    heart_rate = vitals.get('heartRate', 75)
    if heart_rate > 120:
        score += 15  # Tachycardia
    elif heart_rate < 50:
        score += 15  # Bradycardia
    elif heart_rate > 100:
        score += 8  # Elevated
    
    # Temperature (in °F)
    temperature = vitals.get('temperature', 98.6)
    if temperature > 103:
        score += 15  # High fever
    elif temperature > 100.4:
        score += 10  # Fever
    elif temperature < 95:
        score += 20  # Hypothermia
    
    # 2. Symptoms Analysis (0-40 points)
    
    # Normalize symptoms to lowercase for comparison
    normalized_symptoms = [s.lower() for s in symptoms]
    
    # Check for critical symptoms
    for symptom in normalized_symptoms:
        if symptom in CRITICAL_SYMPTOMS:
            score += 40
            break  # One critical symptom is enough
    
    # If no critical symptoms, check concerning symptoms
    if score < 40:
        concerning_count = sum(1 for s in normalized_symptoms if s in CONCERNING_SYMPTOMS)
        score += min(concerning_count * 10, 25)  # Max 25 points from concerning symptoms
    
    # 3. Age Factor (0-10 points)
    
    if age < 1:
        score += 10  # Infant
    elif age < 12:
        score += 8   # Child
    elif age >= 75:
        score += 10  # Elderly
    elif age >= 65:
        score += 5   # Senior
    
    # 4. Cap the score at 100
    score = min(score, 100)
    
    # If score is very low and patient has any symptoms, give minimum score
    if len(symptoms) > 0 and score < 15:
        score = 15
    
    return int(score)
