// backend/src/controllers/verificationController.ts
import { Response } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../middleware/authMiddleware'; 
import { Voter, VoterDocument } from '../models/Voter'; 

const handleVerificationError = (res: Response, error: unknown, context: string, statusCode: number = 500) => {
    const err = error as Error;
    console.error(`[VerifyC] Error in ${context}:`, err.message);
    res.status(statusCode).json({ message: `Failed during ${context}`, error: err.message });
};

export const verifyFaceStub = async (req: AuthRequest, res: Response): Promise<void> => {
    const context = "face verification (stub)";
    const voterIdFromToken = req.voterSession?.voterId; 
    const aadharFromToken = req.voterSession?.aadharNumber;

    if (!voterIdFromToken) {
        console.error(`[VerifyC] ${context}: Voter ID missing from session token. Middleware should have caught this.`);
        res.status(403).json({ message: "Invalid session. Voter ID missing." });
        return; 
    }

    const { livePhotoData } = req.body; // Frontend sends base64 live photo data

    console.log(`[VerifyC] ${context} attempt for voterId: ${voterIdFromToken} (Aadhaar from token: ${aadharFromToken || 'N/A'})`);

    if (!livePhotoData) { 
        res.status(400).json({ message: "Live photo data is required for face verification." });
        return; 
    }

    try {
        const voter: VoterDocument | null = await Voter.findById(voterIdFromToken);
        if (!voter) {
            console.log(`[VerifyC] ${context}: Voter not found with ID: ${voterIdFromToken}`);
            res.status(404).json({ message: "Voter record not found." });
            return;
        }

        if (voter.hasVoted) {
            console.log(`[VerifyC] ${context}: Attempt for already voted voter: ${voterIdFromToken}`);
            res.status(403).json({ message: 'This voter has already cast their vote and cannot be re-verified.' });
            return;
        }

        console.log(`[VerifyC] STUB: "Comparing" live photo for voter ${voterIdFromToken} with their stored ID photo: ${voter.photoUrl || '(No photo on record for comparison)'}`);
        // --- STUBBED AI FACE RECOGNITION LOGIC ---
        const isMatch = true; // For this stub, always simulate a successful match.
        // --- END STUBBED AI LOGIC ---

        if (isMatch) {
            console.log(`[VerifyC] ${context}: Face match successful (stubbed) for voterId: ${voterIdFromToken}.`);

            const queueAndVotePurpose = 'voter-queue-and-vote-session';
            const queueAndVoteToken = jwt.sign(
                { 
                    voterId: voter._id.toString(), 
                    purpose: queueAndVotePurpose,
                    fullName: voter.fullName, // Include fullName for potential use in queue
                    aadharNumber: voter.aadharNumber, // Carry over for logging/audit
                    registerNumber: voter.registerNumber // Carry over for logging/audit
                },
                process.env.JWT_SECRET!,
                { expiresIn: '1h' } // e.g., 1 hour for queueing and voting window
            );

            res.status(200).json({ 
                success: true, 
                message: 'Face successfully verified (stubbed). You can now request a voting slot.',
                sessionToken: queueAndVoteToken, 
                 voterInfo: { 
                    id: voter._id.toString(),
                    fullName: voter.fullName,
                }
            });
        } else {
            console.log(`[VerifyC] ${context}: Face match failed (stubbed) for voterId: ${voterIdFromToken}.`);
            res.status(400).json({ success: false, message: 'Face verification failed. Photo does not appear to match ID proof (stubbed).' });
        }
    } catch (error) {
        handleVerificationError(res, error, context);
    }
};