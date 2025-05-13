import mongoose, { Types } from 'mongoose';
// backend/src/controllers/candidateController.ts
import { Response } from 'express';

import { Candidate } from '../models/Candidate'; // Corrected import path
import { AuthRequest } from '../middleware/authMiddleware'; 
// Import other necessary types or models

const handleCandidateError = (res: Response, error: unknown, context: string, statusCode: number = 500) => {
    const err = error as Error;
    console.error(`[CandC] Error in ${context}:`, err.message, err.stack);
    res.status(statusCode).json({ message: `Failed to ${context}`, error: err.message });
};

export const getCandidates = async (req: AuthRequest, res: Response): Promise<void> => {
    const context = "fetch candidates";
    const voterId = req.voterSession?.voterId; // Available if using protectVoterStepSession

    console.log(`[CandC] Voter ${voterId || 'Unknown (public?)'} requesting candidates.`);

    try {
        // For MVP, let's assume we fetch all candidates.
        // Later, you might filter by electionId if that's part of req.query or req.voterSession
        // const electionId = req.query.electionId as string | undefined;
        // const query = electionId ? { electionId } : {};
        const candidates = await Candidate.find({}).sort({ name: 1 }); 
        
        if (!candidates) { // find() returns [], not null if no docs match
            console.log(`[CandC] No candidates found.`);
            res.status(200).json([]); 
            return;
        }

        console.log(`[CandC] Fetched ${candidates.length} candidates.`);
        res.status(200).json(candidates);
    } catch (error) {
        handleCandidateError(res, error, context);
    }
};

// Optional: Admin route to create a candidate (if not solely relying on seeding)
// Ensure req.user is populated by 'protect' middleware if this is an admin-only route
export const createCandidate = async (req: AuthRequest, res: Response): Promise<void> => {
    const context = "create candidate";
    // Example admin check:
    // if (req.user?.role !== 'admin') {
    //     res.status(403).json({ message: 'Forbidden: Admin access required.' });
    //     return;
    // }
    try {
        const { name, party, symbolUrl, position, electionId } = req.body;
        if (!name) {
            res.status(400).json({ message: "Candidate name is required."});
            return;
        }
        // Add more validation as needed
        const newCandidateData: Partial<typeof Candidate.schema.obj> = { name, party, symbolUrl, position };
        if (electionId && mongoose.Types.ObjectId.isValid(electionId)) {
            newCandidateData.electionId = new Types.ObjectId(electionId);
        }

        const newCandidate = await Candidate.create(newCandidateData);
        console.log(`[CandC] Candidate created: ${newCandidate.name}`);
        res.status(201).json(newCandidate);
    } catch (error) {
        handleCandidateError(res, error, context);
    }
};
