// backend/src/routes/queueRoutes.ts
import express from 'express';
import {
  addToken,
  getTokens,
  completeToken,
  clearQueue,
  requestVotingSlotStub
} from '../controllers/queueController';
import { protect, protectVoterStepSession } from '../middleware/authMiddleware';

const router = express.Router();

const QUEUE_VOTE_PURPOSE = 'voter-queue-and-vote-session';

router.post(
    '/request-slot', 
    protectVoterStepSession(QUEUE_VOTE_PURPOSE), 
    requestVotingSlotStub 
);

router.post('/', protect, addToken); 
router.get('/', protect, getTokens);  
router.patch('/:id/complete', protect, completeToken); // This should now align due to generic AuthRequest
router.delete('/reset', protect, clearQueue); 

export default router;
