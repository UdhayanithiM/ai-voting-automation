import express from 'express'
import { getAllVoters } from '../controllers/voterController'
import { protect } from '../middleware/authMiddleware'

const router = express.Router()

// GET /api/admin/voters
router.get('/voters', protect, getAllVoters)

export default router
