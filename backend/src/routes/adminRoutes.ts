// backend/src/routes/adminRoutes.ts
import express from 'express';
import {
  getAllVoters,
  approveVoter,
  flagVoter,
  createOfficer,
  getAdminStats,
  getVoteLogs,
  createVoterByAdmin, // Import the new controller function
} from '../controllers/adminController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Admin dashboard stats
router.get('/stats', protect, getAdminStats);
router.get('/votes', protect, getVoteLogs);

// Officer management
router.post('/officers', protect, createOfficer);

// Voter management by Admin
router.get('/voters', protect, getAllVoters);
router.post('/voters/create-direct', protect, createVoterByAdmin); // **NEW ROUTE**
router.post('/voters/:id/approve', protect, approveVoter);
router.post('/voters/:id/flag', protect, flagVoter);

export default router;