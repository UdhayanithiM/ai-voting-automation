// backend/src/routes/verificationRoutes.ts
import express from 'express';
import { verifyFaceStub } from '../controllers/verificationController';
import { protectVoterStepSession } from '../middleware/authMiddleware';

const router = express.Router();

const FACE_VERIFICATION_PURPOSE = 'voter-face-verification-session';

router.post(
    '/face', 
    protectVoterStepSession(FACE_VERIFICATION_PURPOSE), 
    verifyFaceStub
);

export default router;