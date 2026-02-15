/**
 * Health Intake Routes
 * Routes for appointment booking with health data and ML severity prediction
 */

import express from 'express';
import authUser from '../middleware/authUser.js';
import upload from '../middleware/multer.js';
import {
    bookWithHealthIntake,
    uploadWoundImage,
    uploadMedicalReports,
    getSeverityDetails
} from '../controllers/healthIntakeController.js';

const healthIntakeRouter = express.Router();

// Book appointment with health intake data
healthIntakeRouter.post('/book-with-intake', authUser, bookWithHealthIntake);

// Upload wound image for severity analysis
healthIntakeRouter.post('/upload-wound', authUser, upload.single('woundImage'), uploadWoundImage);

// Upload medical reports (PDF/images)
healthIntakeRouter.post('/upload-reports', authUser, upload.array('reports', 5), uploadMedicalReports);

// Get severity analysis details
healthIntakeRouter.get('/severity-details/:appointmentId', authUser, getSeverityDetails);

export default healthIntakeRouter;
