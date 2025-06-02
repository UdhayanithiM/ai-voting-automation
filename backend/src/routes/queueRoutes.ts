// backend/src/routes/queueRoutes.ts
import express from 'express';
import {
  addToken,
  getTokens,
  completeToken,
  clearQueue,
  requestVotingSlotStub,
  getEstimatedWaitTime // ** ENSURE THIS IS IMPORTED **
} from '../controllers/queueController';
import { protect, protectVoterStepSession } from '../middleware/authMiddleware';

const router = express.Router();

const QUEUE_VOTE_PURPOSE = 'voter-queue-and-vote-session';

// Voter actions
router.post(
    '/request-slot',
    protectVoterStepSession(QUEUE_VOTE_PURPOSE),
    requestVotingSlotStub
);

router.get('/estimate-wait-time', getEstimatedWaitTime); // This route calls the updated controller


// Officer/Admin protected queue management actions
router.post('/', protect, addToken);
router.get('/', protect, getTokens);
router.patch('/:id/complete', protect, completeToken);
router.delete('/reset', protect, clearQueue);

export default router;