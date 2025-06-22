// backend/src/routes/verificationRoutes.ts
import express from 'express';
import { verifyFace } from '../controllers/verificationController'; // Import the new function
import { protectVoterSession } from '../middleware/protectVoterSession';

const router = express.Router();

// The route is updated to be more descriptive and points to the real verification logic
router.route('/face-verify').post(protectVoterSession, verifyFace);

export default router;