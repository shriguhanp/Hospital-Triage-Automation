import medicationDataModel from '../models/medicationDataModel.js';
import fs from 'fs';

// Upload medical reports
export const uploadReports = async (req, res) => {
    try {
        const { userId, description } = req.body;
        const files = req.files;

        if (!files || files.length === 0) {
            return res.json({ success: false, message: 'No files uploaded' });
        }

        // Get or create medication data for user
        let medicationData = await medicationDataModel.findOne({ userId });

        if (!medicationData) {
            medicationData = new medicationDataModel({ userId, reports: [], conditions: [], healthMetrics: [] });
        }

        // Add reports
        const newReports = files.map(file => ({
            fileName: file.originalname,
            fileUrl: `/uploads/medical-reports/${file.filename}`,
            description: description || '',
            uploadDate: new Date()
        }));

        medicationData.reports.push(...newReports);
        await medicationData.save();

        res.json({ success: true, message: 'Reports uploaded successfully', reports: newReports });

    } catch (error) {
        console.error('Upload error:', error);
        res.json({ success: false, message: error.message });
    }
};

// Add medical condition
export const addCondition = async (req, res) => {
    try {
        const { userId, condition } = req.body;

        if (!condition) {
            return res.json({ success: false, message: 'Condition is required' });
        }

        // Get or create medication data
        let medicationData = await medicationDataModel.findOne({ userId });

        if (!medicationData) {
            medicationData = new medicationDataModel({ userId, reports: [], conditions: [], healthMetrics: [] });
        }

        medicationData.conditions.push({
            condition,
            date: new Date()
        });

        await medicationData.save();

        res.json({ success: true, message: 'Condition saved successfully' });

    } catch (error) {
        console.error('Save error:', error);
        res.json({ success: false, message: error.message });
    }
};

// Add health metrics
export const addHealthMetrics = async (req, res) => {
    try {
        const { userId, metrics } = req.body;

        // Get or create medication data
        let medicationData = await medicationDataModel.findOne({ userId });

        if (!medicationData) {
            medicationData = new medicationDataModel({ userId, reports: [], conditions: [], healthMetrics: [] });
        }

        const metricEntry = {
            bloodPressure: metrics.bloodPressure || null,
            heartRate: metrics.heartRate || null,
            temperature: metrics.temperature || null,
            weight: metrics.weight || null,
            bloodSugar: metrics.bloodSugar || null,
            date: new Date()
        };

        medicationData.healthMetrics.push(metricEntry);
        await medicationData.save();

        res.json({ success: true, message: 'Health metrics saved successfully', metric: metricEntry });

    } catch (error) {
        console.error('Save error:', error);
        res.json({ success: false, message: error.message });
    }
};

// Get all medication data for user
export const getUserMedicationData = async (req, res) => {
    try {
        const { userId } = req.params;

        const medicationData = await medicationDataModel.findOne({ userId });

        if (!medicationData) {
            return res.json({
                success: true,
                reports: [],
                conditions: [],
                healthMetrics: []
            });
        }

        // Sort by most recent first
        const sortedReports = medicationData.reports.sort((a, b) => b.uploadDate - a.uploadDate);
        const sortedConditions = medicationData.conditions.sort((a, b) => b.date - a.date);
        const sortedMetrics = medicationData.healthMetrics.sort((a, b) => b.date - a.date);

        res.json({
            success: true,
            reports: sortedReports,
            conditions: sortedConditions,
            healthMetrics: sortedMetrics
        });

    } catch (error) {
        console.error('Fetch error:', error);
        res.json({ success: false, message: error.message });
    }
};
