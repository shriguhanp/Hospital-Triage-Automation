import express from 'express';
import { 
    getDoctorQueue, 
    getPatientQueueStatus, 
    bookWithPriority, 
    autoBookEmergencySlot, 
    updatePriority,
    getQueueStats 
} from '../controllers/queueController.js';
import userAuth from '../middleware/authUser.js';

const queueRouter = express.Router();

// Get doctor's priority queue (for doctors)
queueRouter.post('/doctor-queue', userAuth, getDoctorQueue);

// Get patient's queue status (for patients)
queueRouter.post('/patient-queue-status', userAuth, getPatientQueueStatus);

// Book appointment with priority scoring
queueRouter.post('/book-with-priority', userAuth, bookWithPriority);

// Auto-book emergency slot
queueRouter.post('/auto-book-emergency', userAuth, autoBookEmergencySlot);

// Update appointment priority
queueRouter.post('/update-priority', userAuth, updatePriority);

// Get queue statistics
queueRouter.post('/queue-stats', userAuth, getQueueStats);

export default queueRouter;
