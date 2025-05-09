import express from 'express'
import { submitFeedback, getAllFeedback } from '../controllers/feedbackController'
import { protect } from '../middleware/authMiddleware'

const router = express.Router()

router.post('/', submitFeedback) // public

// ✅ Protected route for admin
router.get('/', protect, getAllFeedback)

export default router
