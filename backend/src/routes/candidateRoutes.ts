// backend/src/routes/candidateRoutes.ts
import express from 'express';
import { getCandidates, createCandidate } from '../controllers/candidateController';
import { protectVoterStepSession, protect } from '../middleware/authMiddleware'; // protect for admin actions

const router = express.Router();

// Purpose of the token required for a voter to get candidates (must have passed face verification and queue slotting)
const VOTER_CAN_VOTE_PURPOSE = 'voter-queue-and-vote-session'; 

// GET /api/candidates - Voter fetches candidates list
// Protected by the session token indicating the voter is ready to see candidates/vote
router.get(
    '/', 
    protectVoterStepSession(VOTER_CAN_VOTE_PURPOSE), 
    getCandidates
);

// POST /api/candidates - Admin creates a new candidate (example)
// This route would be protected by the general 'protect' middleware for admin users
// router.post(
//     '/',
//     protect, // General admin/officer protection
//     // Add another middleware here to check if (req.user.role === 'admin')
//     createCandidate 
// );

export default router;
