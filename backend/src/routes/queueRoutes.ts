import express from 'express'
import {
  addToken,
  getTokens,
  completeToken,
  clearQueue,
} from '../controllers/queueController'
import { protect } from '../middleware/authMiddleware'

const router = express.Router()

// ✅ Add new token to queue
router.post('/', addToken)

// ✅ Get tokens by status (waiting/completed)
router.get('/', getTokens)

// ✅ Mark a token as completed
router.patch('/:id/complete', completeToken)

// ✅ 🧹 Clear entire queue (requires auth)
router.delete('/reset',  clearQueue)

export default router
