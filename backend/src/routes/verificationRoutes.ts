import express from 'express';
import { verifyFaceStub } from '../controllers/verificationController'; // Ensure correct function name
import { protectVoterSession } from '../middleware/protectVoterSession';

const router = express.Router();
router.route('/face-stub').post(protectVoterSession, verifyFaceStub);
export default router;