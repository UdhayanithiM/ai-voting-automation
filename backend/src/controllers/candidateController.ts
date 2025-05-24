// backend/src/controllers/candidateController.ts
import { Response } from 'express';
import mongoose, { Types } from 'mongoose'; // Import mongoose and Types
import { Candidate } from '../models/Candidate'; // Corrected import path
import { AuthRequest } from '../middleware/authMiddleware';
// Import other necessary types or models

const handleCandidateError = (res: Response, error: unknown, context: string, statusCode: number = 500) => {
    const err = error as Error;
    console.error(`[CandC] Error in ${context}:`, err.message, err.stack);
    // Ensure this function sends a response like { success: false, message: ... } for consistency
    res.status(statusCode).json({ success: false, message: `Failed to ${context}`, error: err.message });
};

export const getCandidates = async (req: AuthRequest, res: Response): Promise<void> => {
    const context = "fetch candidates";
    const voterId = req.voterSession?.voterId; // Available if using protectVoterStepSession
    const purpose = req.voterSession?.purpose;

    console.log(`[CandC] Attempt to ${context} by voterId: ${voterId} with purpose: ${purpose}. Token is present.`);

    try {
        const candidatesFromDB = await Candidate.find({}).sort({ name: 1 }); // Renamed to avoid confusion

        if (candidatesFromDB.length === 0) {
            console.log(`[CandC] No candidates found in the database.`);
            // Send success true with an empty array as per frontend expectation
            res.status(200).json({ success: true, candidates: [] });
            return;
        }

        console.log(`[CandC] Fetched ${candidatesFromDB.length} candidates.`);
        // Wrap the response in the expected structure { success: true, candidates: [...] }
        res.status(200).json({ success: true, candidates: candidatesFromDB });
    } catch (error) {
        // handleCandidateError will send a response like { success: false, message: ... }
        handleCandidateError(res, error, context);
    }
};

// Optional: Admin route to create a candidate
export const createCandidate = async (req: AuthRequest, res: Response): Promise<void> => {
    const context = "create candidate";
    // Basic admin check example (implement more robust role check if needed)
    // if (req.user?.role !== 'admin') {
    //     res.status(403).json({ success: false, message: 'Forbidden: Admin access required.' });
    //     return;
    // }
    try {
        const { name, party, symbolUrl, position, electionId } = req.body;
        if (!name) {
            res.status(400).json({ success: false, message: "Candidate name is required."});
            return;
        }

        // Create an object that matches CandidateDocument structure, but partial for creation
        const newCandidateData: Partial<mongoose.InferSchemaType<typeof Candidate.schema>> = {
             name,
             party,
             symbolUrl,
             position,
             // voteCount will default to 0 from schema
        };

        if (electionId && Types.ObjectId.isValid(electionId)) {
            newCandidateData.electionId = new Types.ObjectId(electionId);
        } else if (electionId) {
            // Handle invalid electionId if provided but not valid
            console.warn(`[CandC] Invalid electionId format provided: ${electionId}`);
            // Depending on requirements, you might reject or ignore it
        }


        const newCandidate = await Candidate.create(newCandidateData);
        console.log(`[CandC] Candidate created: ${newCandidate.name}`);
        res.status(201).json({ success: true, candidate: newCandidate }); // Send success true
    } catch (error) {
        handleCandidateError(res, error, context);
    }
};