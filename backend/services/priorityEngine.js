/**
 * Priority Engine Service
 * Calculates priority scores for appointments based on severity, waiting time, patient age, and emergency flags
 */

const SEVERITY_WEIGHTS = {
    'Low': 1,
    'Medium': 2,
    'High': 4,
    'Emergency': 8
};

const AGE_FACTORS = {
    'child': 2,      // Under 12
    'senior': 1.5,   // 65 and above
    'adult': 1       // 12-64
};

/**
 * Calculate priority score for an appointment
 * Formula: (severity_weight * 5) + waiting_time + patient_age_factor + manual_emergency_flag
 * 
 * @param {Object} appointment - Appointment data
 * @returns {number} - Calculated priority score
 */
export const calculatePriorityScore = (appointment) => {
    const { severity, symptoms, patientAge, isEmergency, createdAt } = appointment;

    // Severity weight (0-8) * 5 = 0-40 points
    const severityWeight = SEVERITY_WEIGHTS[severity] || 0;
    const severityScore = severityWeight * 5;

    // Waiting time in minutes (0-60 points)
    let waitingTimeScore = 0;
    if (createdAt) {
        const waitMinutes = (Date.now() - new Date(createdAt)) / 60000;
        waitingTimeScore = Math.min(Math.floor(waitMinutes / 5), 60); // Max 60 points for 5+ hours
    }

    // Patient age factor (0-20 points)
    let ageFactor = 0;
    if (patientAge) {
        if (patientAge < 12) {
            ageFactor = 20;
        } else if (patientAge >= 65) {
            ageFactor = 15;
        }
    }

    // Emergency flag bonus (50 points)
    const emergencyBonus = isEmergency ? 50 : 0;

    // Calculate total score
    const totalScore = severityScore + waitingTimeScore + ageFactor + emergencyBonus;

    return totalScore;
};

/**
 * Sort appointments by priority score (highest first)
 * Primary: finalSeverityScore (ML-generated 0-100)
 * Secondary: booking date (earlier bookings first for same severity)
 * 
 * @param {Array} appointments - Array of appointment objects
 * @returns {Array} - Sorted appointments
 */
export const sortByPriority = (appointments) => {
    return [...appointments].sort((a, b) => {
        // Emergency always comes first
        if (a.severity === 'Emergency' && b.severity !== 'Emergency') return -1;
        if (b.severity === 'Emergency' && a.severity !== 'Emergency') return 1;

        // Then sort by finalSeverityScore (ML-generated)
        const scoreA = a.finalSeverityScore || a.priorityScore || calculatePriorityScore(a);
        const scoreB = b.finalSeverityScore || b.priorityScore || calculatePriorityScore(b);

        if (scoreA !== scoreB) {
            return scoreB - scoreA; // Higher score first
        }

        // If same severity score, earlier booking goes first
        return (a.date || 0) - (b.date || 0);
    });
};

/**
 * Get priority queue position for a specific appointment
 * 
 * @param {Array} allAppointments - All appointments for a doctor
 * @param {string} appointmentId - The appointment to find position for
 * @returns {Object} - Queue position and estimated wait time
 */
export const getQueuePosition = (allAppointments, appointmentId, consultationTime = 15) => {
    const sortedAppointments = sortByPriority(
        allAppointments.filter(apt => !apt.cancelled && !apt.isCompleted)
    );

    const position = sortedAppointments.findIndex(apt => apt._id.toString() === appointmentId.toString());

    if (position === -1) {
        return { position: null, estimatedWait: null };
    }

    // Estimate wait time based on doctor's average consultation time
    const estimatedWaitMinutes = position * consultationTime;

    return {
        position: position + 1,
        estimatedWait: estimatedWaitMinutes <= 60
            ? `${estimatedWaitMinutes} min`
            : `${Math.floor(estimatedWaitMinutes / 60)}h ${estimatedWaitMinutes % 60}m`
    };
};

/**
 * Find earliest available priority slot for emergency booking
 * 
 * @param {Object} doctor - Doctor data with slots_booked
 * @param {Array} existingAppointments - Existing appointments for the doctor
 * @returns {Object} - Earliest available slot (date and time)
 */
export const findEarliestPrioritySlot = (doctor, existingAppointments) => {
    const today = new Date();
    const slotsBooked = doctor.slots_booked || {};

    // Check next 7 days for earliest slot
    for (let i = 0; i < 7; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() + i);

        const day = checkDate.getDate();
        const month = checkDate.getMonth() + 1;
        const year = checkDate.getFullYear();
        const slotDate = `${day}_${month}_${year}`;

        // Check each hour from 10 AM to 8 PM
        for (let hour = 10; hour <= 20; hour++) {
            const slotTime = `${hour.toString().padStart(2, '0')}:00`;

            // Check if slot is already booked
            const isBooked = slotsBooked[slotDate] && slotsBooked[slotDate].includes(slotTime);

            // Check if any appointment exists for this slot
            const existingAppointment = existingAppointments.find(
                apt => apt.slotDate === slotDate && apt.slotTime === slotTime && !apt.cancelled
            );

            if (!isBooked && !existingAppointment) {
                return {
                    slotDate,
                    slotTime,
                    datetime: checkDate
                };
            }
        }
    }

    return null; // No available slot found
};

/**
 * Get severity badge color
 * 
 * @param {string} severity - Severity level
 * @returns {string} - CSS color class
 */
export const getSeverityColor = (severity) => {
    const colors = {
        'Low': 'bg-green-100 text-green-800 border-green-200',
        'Medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
        'High': 'bg-orange-100 text-orange-800 border-orange-200',
        'Emergency': 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[severity] || colors['Low'];
};

/**
 * Get severity icon
 * 
 * @param {string} severity - Severity level
 * @returns {string} - Icon component name or emoji
 */
export const getSeverityIcon = (severity) => {
    const icons = {
        'Low': '🟢',
        'Medium': '🟡',
        'High': '🟠',
        'Emergency': '🔴'
    };
    return icons[severity] || icons['Low'];
};

/**
 * Calculate priority score from comprehensive health profile
 * Formula: (severity × 0.35) + (chronic × 0.20) + (symptom × 0.20) + (age × 0.10) + (vitals × 0.10) + (history × 0.05)
 * 
 * @param {Object} healthProfile - Complete health profile data
 * @returns {Object} - { score: number, level: string, colorCode: string }
 */
export const calculateFromHealthProfile = (healthProfile) => {
    if (!healthProfile) {
        return { score: 0, level: 'LOW', colorCode: '#10B981' };
    }

    let score = 0;

    // 1. SEVERITY SCORE (35% weight) - Based on critical symptoms and vitals
    let severityScore = 0;

    // Critical vitals
    if (healthProfile.vitals) {
        const { systolicBP, diastolicBP, spo2, heartRate, temperature } = healthProfile.vitals;

        // SpO2 < 92 → +40
        if (spo2 > 0 && spo2 < 92) severityScore += 40;
        else if (spo2 >= 92 && spo2 < 95) severityScore += 20;

        // BP > 180/120 → +35
        if (systolicBP > 180 || diastolicBP > 120) severityScore += 35;
        else if (systolicBP > 140 || diastolicBP > 90) severityScore += 15;
        else if (systolicBP < 90 || diastolicBP < 60) severityScore += 25; // Hypotension

        // Heart rate abnormalities
        if (heartRate > 120 || heartRate < 50) severityScore += 20;
        else if (heartRate > 100 || heartRate < 60) severityScore += 10;

        // Temperature
        if (temperature > 103) severityScore += 20;
        else if (temperature > 100.4) severityScore += 10;
        else if (temperature < 95) severityScore += 25; // Hypothermia

        // Sugar level
        if (healthProfile.vitals.sugarLevel > 300) severityScore += 15;
        else if (healthProfile.vitals.sugarLevel < 70) severityScore += 20;
    }

    // Critical symptoms
    if (healthProfile.breathingDifficulty) severityScore += 45;
    if (healthProfile.bleeding) severityScore += 30;
    if (healthProfile.fever) severityScore += 10;

    // Pain level (1-10 scale)
    if (healthProfile.painLevel >= 8) severityScore += 25;
    else if (healthProfile.painLevel >= 6) severityScore += 15;
    else if (healthProfile.painLevel >= 4) severityScore += 8;

    // Sudden onset and worsening
    if (healthProfile.sudden) severityScore += 15;
    if (healthProfile.worsening) severityScore += 15;

    // Normalize severity to 0-100, then apply 35% weight
    severityScore = Math.min(severityScore, 100);
    score += severityScore * 0.35;

    // 2. CHRONIC CONDITIONS SCORE (20% weight)
    let chronicScore = 0;
    if (healthProfile.conditions) {
        const conditions = healthProfile.conditions;

        // Each chronic disease → +6
        if (conditions.diabetes) chronicScore += 6;
        if (conditions.hypertension) chronicScore += 6;
        if (conditions.asthma) chronicScore += 6;
        if (conditions.heartDisease) chronicScore += 10; // Higher weight
        if (conditions.kidneyDisease) chronicScore += 8;
        if (conditions.cancer) chronicScore += 12; // Higher weight
        if (conditions.strokeHistory) chronicScore += 10;
    }

    // Normalize and apply 20% weight
    chronicScore = Math.min(chronicScore, 100);
    score += chronicScore * 0.20;

    // 3. SYMPTOM SCORE (20% weight)
    let symptomScore = 0;

    // Critical symptom tags
    const criticalSymptoms = [
        'chest pain', 'heart attack', 'stroke', 'seizure',
        'unconscious', 'severe bleeding', 'head injury',
        'difficulty breathing', 'choking', 'severe burn'
    ];

    if (healthProfile.symptomTags && healthProfile.symptomTags.length > 0) {
        const hasCritical = healthProfile.symptomTags.some(tag =>
            criticalSymptoms.some(cs => tag.toLowerCase().includes(cs))
        );

        if (hasCritical) {
            symptomScore += 40; // Chest pain → +40
        } else {
            // Regular symptoms: +5 per symptom, max 30
            symptomScore += Math.min(healthProfile.symptomTags.length * 5, 30);
        }
    }

    // Duration factor
    if (healthProfile.duration) {
        if (healthProfile.duration.unit === 'weeks') {
            symptomScore += 10;
        } else if (healthProfile.duration.unit === 'days' && healthProfile.duration.value > 7) {
            symptomScore += 8;
        }
    }

    // Normalize and apply 20% weight
    symptomScore = Math.min(symptomScore, 100);
    score += symptomScore * 0.20;

    // 4. AGE SCORE (10% weight)
    let ageScore = 0;
    if (healthProfile.age) {
        if (healthProfile.age < 1) ageScore = 25; // Infant
        else if (healthProfile.age < 5) ageScore = 20; // Toddler
        else if (healthProfile.age < 12) ageScore = 15; // Child
        else if (healthProfile.age > 75) ageScore = 20; // Elderly
        else if (healthProfile.age >= 65) ageScore = 15; // Age > 65 → +15
        else if (healthProfile.age >= 50) ageScore = 8;
    }

    // Pregnancy adds risk
    if (healthProfile.pregnancyStatus) ageScore += 15;

    // Normalize and apply 10% weight
    ageScore = Math.min(ageScore, 100);
    score += ageScore * 0.10;

    // 5. VITALS SCORE (10% weight) - Additional vital sign considerations
    let vitalsScore = 0;

    // Already counted critical vitals in severity, this is for moderate abnormalities
    if (healthProfile.vitals) {
        const { systolicBP, diastolicBP, spo2, heartRate } = healthProfile.vitals;

        // Moderate abnormalities not caught in severity
        if (spo2 >= 95 && spo2 < 97) vitalsScore += 5;
        if (systolicBP >= 130 && systolicBP <= 140) vitalsScore += 5;
        if (heartRate >= 90 && heartRate <= 100) vitalsScore += 5;
    }

    // Normalize and apply 10% weight
    vitalsScore = Math.min(vitalsScore, 100);
    score += vitalsScore * 0.10;

    // 6. HISTORY SCORE (5% weight)
    let historyScore = 0;

    // Recent hospitalization → +12
    if (healthProfile.recentHospitalization) historyScore += 12;

    // ICU history
    if (healthProfile.icuHistory) historyScore += 10;

    // Surgeries
    if (healthProfile.surgeries && healthProfile.surgeries.length > 0) {
        historyScore += Math.min(healthProfile.surgeries.length * 3, 15);
    }

    // Allergies (risk factor)
    if (healthProfile.allergies && healthProfile.allergies.length > 0) {
        historyScore += Math.min(healthProfile.allergies.length * 2, 10);
    }

    // Pregnancy complications
    if (healthProfile.pregnancyComplications && healthProfile.pregnancyComplications.length > 0) {
        historyScore += 15;
    }

    // High-risk medications
    if (healthProfile.medications) {
        if (healthProfile.medications.bloodThinners) historyScore += 8;
        if (healthProfile.medications.chemotherapy) historyScore += 12;
        if (healthProfile.medications.steroids) historyScore += 5;
        if (healthProfile.medications.insulin) historyScore += 5;
    }

    // Normalize and apply 5% weight
    historyScore = Math.min(historyScore, 100);
    score += historyScore * 0.05;

    // Final score (0-100)
    const finalScore = Math.min(Math.round(score), 100);

    // Determine priority level
    const level = getPriorityLevel(finalScore);
    const colorCode = getColorCode(level);

    return {
        score: finalScore,
        level,
        colorCode,
        breakdown: {
            severity: Math.round(severityScore * 0.35),
            chronic: Math.round(chronicScore * 0.20),
            symptom: Math.round(symptomScore * 0.20),
            age: Math.round(ageScore * 0.10),
            vitals: Math.round(vitalsScore * 0.10),
            history: Math.round(historyScore * 0.05)
        }
    };
};

/**
 * Get priority level from score
 * @param {number} score - Priority score (0-100)
 * @returns {string} - Priority level
 */
export const getPriorityLevel = (score) => {
    if (score >= 76) return 'CRITICAL';
    if (score >= 51) return 'HIGH';
    if (score >= 26) return 'MEDIUM';
    return 'LOW';
};

/**
 * Get color code for priority level
 * @param {string} level - Priority level
 * @returns {string} - Hex color code
 */
export const getColorCode = (level) => {
    const colors = {
        'LOW': '#10B981',      // Green
        'MEDIUM': '#F59E0B',   // Yellow
        'HIGH': '#F97316',     // Orange
        'CRITICAL': '#EF4444'  // Red
    };
    return colors[level] || colors['LOW'];
};

export default {
    calculatePriorityScore,
    sortByPriority,
    getQueuePosition,
    findEarliestPrioritySlot,
    getSeverityColor,
    getSeverityIcon,
    calculateFromHealthProfile,
    getPriorityLevel,
    getColorCode,
    SEVERITY_WEIGHTS,
    AGE_FACTORS
};
