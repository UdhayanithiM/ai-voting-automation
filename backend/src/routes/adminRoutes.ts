import express from 'express'
import {
  getAllVoters,
  approveVoter,
  flagVoter,
  createOfficer,
  getAdminStats,
  getVoteLogs,
} from '../controllers/adminController'
import { protect } from '../middleware/authMiddleware'

const router = express.Router()

// Admin functionalities
router.get('/voters', protect, getAllVoters)            // View all voters
router.post('/voters/:id/approve', protect, approveVoter) // Approve voter (fixed)
router.post('/voters/:id/flag', protect, flagVoter)     // Flag voter (fixed)

// Officer management
router.post('/officers', protect, createOfficer)         // Create officer

// Admin dashboard stats
router.get('/stats', protect, getAdminStats)             // Get dashboard stats
router.get('/votes', protect, getVoteLogs) // Add this with other admin routes

export default router