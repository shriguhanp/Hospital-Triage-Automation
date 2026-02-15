import healthProfileModel from "../models/healthProfileModel.js";
import { calculateFromHealthProfile } from "../services/priorityEngine.js";
import { v2 as cloudinary } from 'cloudinary';
import { getIO } from "../socketServer.js";
import { analyzeWound } from "../services/mlService.js";

/**
 * Create health profile for a patient
 * POST /api/health/create
 */
export const createHealthProfile = async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.json({ success: false, message: 'User ID required' });
        }

        // Check if profile already exists
        const existingProfile = await healthProfileModel.findOne({ patientId: userId });
        if (existingProfile) {
            return res.json({
                success: false,
                message: 'Health profile already exists. Use update endpoint.'
            });
        }

        // Create new profile
        const newProfile = new healthProfileModel({
            patientId: userId,
            ...req.body
        });

        // Calculate priority score
        const priorityData = calculateFromHealthProfile(newProfile);
        newProfile.priorityScore = priorityData.score;
        newProfile.priorityLevel = priorityData.level;
        newProfile.colorCode = priorityData.colorCode;

        await newProfile.save();

        res.json({
            success: true,
            message: 'Health profile created successfully',
            profile: newProfile,
            priorityData
        });

    } catch (error) {
        console.error('Error creating health profile:', error);
        res.json({ success: false, message: error.message });
    }
};

/**
 * Get health profile for a patient
 * GET /api/health/:patientId
 */
export const getHealthProfile = async (req, res) => {
    try {
        const { patientId } = req.params;

        const profile = await healthProfileModel.findOne({ patientId });

        if (!profile) {
            return res.json({
                success: false,
                message: 'Health profile not found',
                profile: null
            });
        }

        res.json({
            success: true,
            profile
        });

    } catch (error) {
        console.error('Error fetching health profile:', error);
        res.json({ success: false, message: error.message });
    }
};

/**
 * Update health profile (auto-save)
 * PUT /api/health/update
 */
export const updateHealthProfile = async (req, res) => {
    try {
        const { userId, ...updateData } = req.body;

        if (!userId) {
            return res.json({ success: false, message: 'User ID required' });
        }

        // Find and update profile
        let profile = await healthProfileModel.findOne({ patientId: userId });

        if (!profile) {
            // Create new profile if doesn't exist
            profile = new healthProfileModel({
                patientId: userId,
                ...updateData
            });
        } else {
            // Update existing profile
            Object.assign(profile, updateData);
        }

        // Recalculate priority score
        const priorityData = calculateFromHealthProfile(profile);
        profile.priorityScore = priorityData.score;
        profile.priorityLevel = priorityData.level;
        profile.colorCode = priorityData.colorCode;
        profile.lastUpdated = Date.now();

        await profile.save();

        // Emit socket event for real-time priority update
        try {
            const io = getIO();
            if (io) {
                io.to(userId).emit('priority_score_updated', {
                    score: profile.priorityScore,
                    level: profile.priorityLevel,
                    colorCode: profile.colorCode
                });
            }
        } catch (socketError) {
            console.log('Socket not available for real-time update');
        }

        res.json({
            success: true,
            message: 'Health profile updated successfully',
            profile,
            priorityData
        });

    } catch (error) {
        console.error('Error updating health profile:', error);
        res.json({ success: false, message: error.message });
    }
};

/**
 * Upload medical reports
 * POST /api/health/upload-report
 */
export const uploadReport = async (req, res) => {
    try {
        const { userId, reportType } = req.body;
        const files = req.files;

        if (!userId) {
            return res.json({ success: false, message: 'User ID required' });
        }

        if (!files || files.length === 0) {
            return res.json({ success: false, message: 'No files provided' });
        }

        if (!reportType || !['woundImages', 'labReportPDFs', 'xrayImages', 'ecgCSVs'].includes(reportType)) {
            return res.json({ success: false, message: 'Invalid report type' });
        }

        // Upload files to Cloudinary and potentially analyze
        const uploadPromises = files.map(async (file) => {
            const upload = await cloudinary.uploader.upload(file.path, {
                resource_type: 'auto',
                folder: `health_reports/${reportType}`
            });

            // If it's a wound image, analyze it
            if (reportType === 'woundImages') {
                try {
                    const analysis = await analyzeWound(file.path);
                    return { url: upload.secure_url, analysis };
                } catch (error) {
                    console.error('Error analyzing wound image:', error);
                    return { url: upload.secure_url, analysis: null };
                }
            }

            return { url: upload.secure_url, analysis: null };
        });

        const uploads = await Promise.all(uploadPromises);
        const reportURLs = uploads.map(u => u.url);
        const analysisResults = uploads.map(u => u.analysis).filter(a => a !== null);

        // Update health profile
        const profile = await healthProfileModel.findOne({ patientId: userId });
        if (!profile) {
            return res.json({ success: false, message: 'Health profile not found' });
        }

        // Add new report URLs to existing array
        profile.reports[reportType] = [...(profile.reports[reportType] || []), ...reportURLs];
        profile.lastUpdated = Date.now();

        // Update priority score if analysis indicates high severity
        let maxSeverityScore = 0;
        if (analysisResults.length > 0) {
            analysisResults.forEach(res => {
                if (res.score > maxSeverityScore) maxSeverityScore = res.score;
            });

            // If the AI detected high severity, we might want to boost the priority
            // This is a simple integration; ideally priorityEngine should handle this
            if (maxSeverityScore > 70) {
                // For now, let's just log it or attach to response
                // In a real scenario, we'd update profile.priorityScore logic
            }
        }

        // Recalculate priority (reports might affect score)
        const priorityData = calculateFromHealthProfile(profile);

        // Override if AI found something critical (simple override for now)
        if (maxSeverityScore > 80 && priorityData.score < maxSeverityScore) {
            profile.priorityScore = maxSeverityScore;
            profile.priorityLevel = 'HIGH'; // or map from score
            if (maxSeverityScore > 90) profile.priorityLevel = 'CRITICAL';
        } else {
            profile.priorityScore = priorityData.score;
            profile.priorityLevel = priorityData.level;
            profile.colorCode = priorityData.colorCode;
        }

        await profile.save();

        res.json({
            success: true,
            message: `${reportURLs.length} report(s) uploaded successfully`,
            reportURLs,
            priorityData: {
                score: profile.priorityScore,
                level: profile.priorityLevel,
                colorCode: profile.colorCode
            },
            analysis: analysisResults.length > 0 ? analysisResults[0] : null // Return first analysis for UI
        });

    } catch (error) {
        console.error('Error uploading reports:', error);
        res.json({ success: false, message: error.message });
    }
};

/**
 * Get priority score for a patient
 * GET /api/health/priority-score/:patientId
 */
export const getPriorityScore = async (req, res) => {
    try {
        const { patientId } = req.params;

        const profile = await healthProfileModel.findOne({ patientId });

        if (!profile) {
            return res.json({
                success: false,
                message: 'Health profile not found',
                priorityData: { score: 0, level: 'LOW', colorCode: '#10B981' }
            });
        }

        // Recalculate to ensure it's up-to-date
        const priorityData = calculateFromHealthProfile(profile);

        res.json({
            success: true,
            priorityData: {
                score: priorityData.score,
                level: priorityData.level,
                colorCode: priorityData.colorCode,
                breakdown: priorityData.breakdown
            }
        });

    } catch (error) {
        console.error('Error getting priority score:', error);
        res.json({ success: false, message: error.message });
    }
};

/**
 * Delete a specific report
 * DELETE /api/health/delete-report
 */
export const deleteReport = async (req, res) => {
    try {
        const { userId, reportType, reportUrl } = req.body;

        if (!userId || !reportType || !reportUrl) {
            return res.json({ success: false, message: 'Missing required fields' });
        }

        const profile = await healthProfileModel.findOne({ patientId: userId });
        if (!profile) {
            return res.json({ success: false, message: 'Health profile not found' });
        }

        // Remove report from array
        if (profile.reports[reportType]) {
            // Check if it's an array of objects or strings (migration safety)
            const currentReports = profile.reports[reportType];
            if (currentReports.length > 0) {
                if (typeof currentReports[0] === 'string') {
                    profile.reports[reportType] = currentReports.filter(url => url !== reportUrl);
                } else {
                    profile.reports[reportType] = currentReports.filter(item => item.url !== reportUrl);
                }
            }

            profile.lastUpdated = Date.now();
            await profile.save();
        }

        res.json({
            success: true,
            message: 'Report deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting report:', error);
        res.json({ success: false, message: error.message });
    }
};

export default {
    createHealthProfile,
    getHealthProfile,
    updateHealthProfile,
    uploadReport,
    getPriorityScore,
    deleteReport
};
