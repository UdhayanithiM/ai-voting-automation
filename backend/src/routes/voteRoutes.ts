// backend/src/routes/voteRoutes.ts
import express from 'express';
import { castVote } from '../controllers/voteController';
import { protectVoterSession } from '../middleware/protectVoterSession'; // Import the middleware

const router = express.Router();

// All routes in this file will use the protectVoterSession middleware
router.use(protectVoterSession);

router.route('/').post(castVote); // POST /api/v1/vote/

export default router;
