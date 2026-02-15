# AI-Powered Triage System - Quick Start Guide

## 🚨 Current Status

✅ **Backend** - Running on port 4000  
✅ **Frontend** - Running on port 5173  
⏳ **ML Service** - Needs to be started manually

## 🎯 Quick Test (2 Minutes)

### Option 1: Test Without ML Service (Works Now!)

The system includes **automatic fallback** - it works even without the ML service running!

1. Open browser: `http://localhost:5173`
2. Login as a patient
3. Navigate to "Book Appointment"
4. Select a doctor and time slot
5. Click "Continue to Health Intake →"
6. **Fill Health Intake Form**: 7. Step 1: Select symptoms (e.g., "Chest Pain", "Fever")
   - Step 2: Choose duration and existing diseases
   - Step 3: Enter vitals (e.g., BP: 150/95, SpO2: 90%, HR: 110, Temp: 101)
   - Step 4: (Optional) Upload wound image
8. Click "Submit & Book Appointment"

**Expected Result:**
- ✅ Appointment booked successfully
- ✅ Severity score calculated using fallback rules
- ✅ Token assigned based on severity
- ✅ Queue position shown

---

### Option 2: Test With Full ML Service

To enable the Python ML API for better predictions:

**Terminal 3** (ML Service - Port 5001):
```bash
cd backend/ml-service

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install flask==3.0.0 flask-cors==4.0.0 pillow==10.1.0 numpy==1.26.2

python app.py
```

You should see:
```
🚀 Starting ML Severity Prediction Service...
📍 Running on http://localhost:5001
```

Now repeat the booking flow above and the system will use the Python ML API!

---

## 📁 What Was Implemented

### Backend (Node.js)
- ✅ Extended `appointmentModel.js` with health intake fields
- ✅ Created `/api/healthintake/book-with-intake` endpoint
- ✅ Created `/api/healthintake/upload-wound` endpoint
- ✅ `mlService.js` - Calls Python ML API with fallback
- ✅ Updated `priorityEngine.js` - Sorts by ML severity score

### Backend (Python Flask)
- ✅ ML service at `backend/ml-service/app.py`
- ✅ Rule-based severity predictor (ready for real ML model)
- ✅ Wound image analyzer (placeholder for CNN)

### Frontend (React)
- ✅ **HealthIntakeForm.jsx** - 4-step wizard
- ✅ **SeverityBadge.jsx** - Color-coded severity display  
- ✅ **Appointment.jsx** - Integrated health intake into booking
- ✅ **QueueCard.jsx** - Shows symptoms, vitals, wound images, AI scores

---

## 🔍 How to Verify It's Working

### 1. Check Backend Logs
When you book an appointment, you should see in backend console:
```
POST /api/healthintake/book-with-intake
✓ ML prediction request sent
✓ Severity score: 75
```

### 2. Check Doctor Dashboard
1. Login as a doctor
2. Navigate to "Queue Management"
3. You should see:
   - **Symptoms pills** (e.g., "Chest Pain", "Fever")
   - **Vitals grid** (BP, SpO2, HR, Temp)
   - **AI Severity Score** in purple badge
   - **Color-coded severity** (red/orange/yellow/green)
   - **Patients sorted by severity** (high first)

### 3. Create Multiple Bookings
Book 3 appointments with different severity levels:

**Patient 1 - Low Severity**:
- Symptoms: Headache
- Vitals: BP 120/80, SpO2 98%, HR 75, Temp 98.6°F
- Expected Score: ~15-25 (Green badge)

**Patient 2 - High Severity**:
- Symptoms: Chest Pain, Difficulty Breathing
- Vitals: BP 150/95, SpO2 90%, HR 110, Temp 101°F
- Expected Score: ~75-85 (Orange/Red badge)

**Patient 3 - Critical**:
- Symptoms: Severe Bleeding, Confusion
- Vitals: BP 90/60, SpO2 88%, HR 130, Temp 103°F
- Expected Score: ~90-100 (Red badge - Emergency)

**Expected Queue Order** (on doctor dashboard):
1. Patient 3 (Critical)
2. Patient 2 (High)
3. Patient 1 (Low)

---

## 🎨 UI Features to Test

### Health Intake Form
- ✅ Progress bar (Step 1/4, 2/4, 3/4, 4/4)
- ✅ Multi-select symptoms with checkboxes
- ✅ Validation (required fields show errors)
- ✅ Image upload with preview
- ✅ "Skip Health Intake" option
- ✅ Back/Next navigation

### Doctor Dashboard
- ✅ Severity badges with color coding
- ✅ Symptoms shown as pills
- ✅ Vitals displayed in grid
- ✅ Wound image thumbnail (click to open)
- ✅ AI severity score in purple
- ✅ "Complete" and "Cancel" buttons

### Current Services Running

| Service | Port | Status | Command |
|---------|------|--------|---------|
| Frontend | 5173 | ✅ Running | Already started |
| Backend | 4000 | ✅ Running | Already started |
| ML Service | 5001 | ⏳ Optional | See Option 2 above |

---

## 🐛 Troubleshooting

**Issue**: "ML Service not responding"  
**Solution**: The system works with fallback! Book appointments normally.

**Issue**: Health intake form doesn't show  
**Solution**: Make sure you selected a time slot first, then click "Continue to Health Intake"

**Issue**: Severity not showing on doctor dashboard  
**Solution**: Only appointments booked through health intake have severity scores. Old appointments show "Low" by default.

---

## 📊 API Endpoints

### New Endpoints

```
POST /api/healthintake/book-with-intake
- Books appointment with health data
- Returns: appointment with severity score, token, queue position

POST /api/healthintake/upload-wound
- Uploads and analyzes wound image
- Returns: image URL, severity score

GET /api/healthintake/severity-details/:appointmentId
- Gets ML analysis for appointment
```

### ML Service Endpoints

```
GET http://localhost:5001/health
- Health check

POST http://localhost:5001/predict-severity
- Predicts severity from vitals + symptoms

POST http://localhost:5001/analyze-wound
- Analyzes wound image
```

---

## ✅ Success Criteria

You'll know it's working when:
1. ✅ Health intake form appears after selecting time slot
2. ✅ Form validates inputs (e.g., BP range 70-250)
3. ✅ Booking succeeds with severity score shown
4. ✅ Doctor dashboard shows health data in queue cards
5. ✅ Patients are sorted high-to-low by severity

**That's it! You now have a working AI-powered triage prototype! 🎉**
