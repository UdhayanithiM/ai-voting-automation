import express from 'express'
import { registerVoter } from '../controllers/voterController'

const router = express.Router()

// ✅ Properly add route path
router.post('/', registerVoter)

export default router
