import express from 'express';
import authUser from '../middleware/authUser.js';
import upload from '../middleware/multer.js';
import {
    createHealthProfile,
    getHealthProfile,
    updateHealthProfile,
    uploadReport,
    getPriorityScore,
    deleteReport
} from '../controllers/healthProfileController.js';

const healthProfileRouter = express.Router();

// Create health profile
healthProfileRouter.post('/create', authUser, createHealthProfile);

// Get health profile by patient ID
healthProfileRouter.get('/:patientId', authUser, getHealthProfile);

// Update health profile (auto-save)
healthProfileRouter.put('/update', authUser, updateHealthProfile);

// Upload medical reports
healthProfileRouter.post('/upload-report', authUser, upload.array('reports', 5), uploadReport);

// Get priority score
healthProfileRouter.get('/priority-score/:patientId', authUser, getPriorityScore);

// Delete a specific report
healthProfileRouter.delete('/delete-report', authUser, deleteReport);

export default healthProfileRouter;
