import express from 'express';
import {
    uploadReports,
    addCondition,
    addHealthMetrics,
    getUserMedicationData
} from '../controllers/medicationController.js';
import authUser from '../middleware/authUser.js';
import multer from 'multer';

const medicationRouter = express.Router();

// Setup multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads/medical-reports');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Routes
medicationRouter.post('/upload-reports', authUser, upload.array('reports', 5), uploadReports);
medicationRouter.post('/add-condition', authUser, addCondition);
medicationRouter.post('/add-health-metrics', authUser, addHealthMetrics);
medicationRouter.get('/user-data/:userId', authUser, getUserMedicationData);

export default medicationRouter;
