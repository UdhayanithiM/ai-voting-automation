import express from 'express'
import { getAllVoters, registerVoter } from '../controllers/voterController'
import { protect } from '../middleware/authMiddleware' // optional

const router = express.Router()

// POST /api/voters - Register a new voter
router.post('/', registerVoter)

// GET /api/voters - Get all voters (protected/admin only)
router.get('/', protect, getAllVoters)

export default router
