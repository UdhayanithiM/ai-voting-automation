    // backend/src/controllers/verificationController.ts
    import { Response, NextFunction } from 'express';
    import jwt from 'jsonwebtoken';
    // AuthRequest should be augmented by protectVoterSession to include req.voter
    import { Request as ExpressRequest } from 'express';
    import { Voter, VoterDocument } from '../models/Voter';
    import asyncHandler from '../middleware/asyncHandler';
    import ErrorResponse from '../utils/ErrorResponse';

    // Define AuthRequest if not already globally defined or imported from middleware
    interface AuthRequest extends ExpressRequest {
        voter?: VoterDocument | null; // Populated by protectVoterSession
    }

    /**
     * @desc    Stub for face verification. Issues a new token for queue & voting if successful.
     * @route   POST /api/verification/face-stub  (or your actual API path, e.g., /api/v1/verification/face-stub)
     * @access  Private (Protected by protectVoterSession middleware)
     */
    export const verifyFaceStub = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
      const context = "face verification (stub)";

      // req.voter is populated by protectVoterSession middleware
      if (!req.voter || !req.voter._id) {
        console.error(`[VerifyC] ${context}: Voter details not found on request object. Check protectVoterSession middleware.`);
        return next(new ErrorResponse("Authentication error: Voter session is invalid.", 401));
      }
      const voterIdFromSession = req.voter._id.toString();
      const voterFromSession = req.voter; // This is the full VoterDocument

      // livePhotoData might not be sent for a stub, but good to check if you plan to use it.
      const { livePhotoData } = req.body;
      // if (!livePhotoData && process.env.NODE_ENV !== 'development_stub') { // Example: make it optional for stubbing
      //   return next(new ErrorResponse("Live photo data is required for face verification.", 400));
      // }

      console.log(`[VerifyC] ${context} attempt for voterId: ${voterIdFromSession}`);

      // No need to fetch voter again if protectVoterSession already did and attached it to req.voter
      // const voter: VoterDocument | null = await Voter.findById(voterIdFromSession); 
      // if (!voter) { ... }

      if (voterFromSession.hasVoted) {
        console.log(`[VerifyC] ${context}: Voter ${voterFromSession.fullName} (ID: ${voterIdFromSession}) has already voted.`);
        return next(new ErrorResponse('This voter has already cast their vote.', 403));
      }

      console.log(`[VerifyC] STUB: Simulating face match. Stored photo: ${voterFromSession.photoUrl || '(ID photo not available)'}`);
      const isMatch = true; // Simulate an always successful match for this stub

      if (isMatch) {
        console.log(`[VerifyC] ${context}: Face match successful for voter ${voterFromSession.fullName}.`);
        
        // Generate a new token for the next phase (queue & vote).
        const queueAndVoteToken = jwt.sign(
          { 
            id: voterFromSession._id.toString(), // Use 'id' for consistency
            purpose: 'voter-queue-and-vote-session',
            fullName: voterFromSession.fullName, // Optional: for display on next page
          },
          process.env.JWT_SECRET_VOTER || 'fallbackVoterQueueSecret!@#$', // Use the same voter secret or a phase-specific one
          { expiresIn: '1h' }
        );

        res.status(200).json({
          success: true,
          message: 'Face successfully verified (stubbed). You can now request a voting slot.',
          token: queueAndVoteToken, // Send this new token to the frontend
          voter: { // Send back voter info for consistency if useVoterAuth needs to update
            id: voterFromSession._id.toString(),
            fullName: voterFromSession.fullName,
            phone: voterFromSession.phoneNumber, // Assuming phoneNumber is on VoterDocument
          }
        });
      } else {
        return next(new ErrorResponse('Face verification failed (stub).', 400));
      }
    });
    