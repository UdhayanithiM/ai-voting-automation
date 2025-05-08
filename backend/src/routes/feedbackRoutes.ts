import express from 'express'
import { submitFeedback } from '../controllers/feedbackController'

const router = express.Router()

router.post('/', submitFeedback)

export default router
