// backend/src/controllers/verificationController.ts
import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import axios from 'axios'; // Import axios to call the Python service
import { Request as ExpressRequest } from 'express';
import { VoterDocument } from '../models/Voter';
import asyncHandler from '../middleware/asyncHandler';
import ErrorResponse from '../utils/ErrorResponse';

interface AuthRequest extends ExpressRequest {
  voter?: VoterDocument | null;
}

// This function replaces the old 'verifyFaceStub'
export const verifyFace = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { livePhotoData } = req.body; // Expects a base64 image string from the frontend

  if (!req.voter || !req.voter._id) {
    return next(new ErrorResponse("Authentication error: Voter session is invalid.", 401));
  }
  if (!livePhotoData) {
    return next(new ErrorResponse("Live photo data is required for face verification.", 400));
  }

  const voterFromSession = req.voter;
  const storedPhotoUrl = voterFromSession.photoUrl;

  if (!storedPhotoUrl) {
    return next(new ErrorResponse("No reference photo found for this voter.", 404));
  }

  try {
    // Call the Python face verification microservice
    const verificationResponse = await axios.post('http://127.0.0.1:5001/verify', {
      img1_base64: storedPhotoUrl,
      img2_base64: livePhotoData,
    });

    const { verified } = verificationResponse.data;

    if (verified === true) {
      console.log(`[VerifyC] Face match successful for voter ${voterFromSession.fullName}.`);
      const queueAndVoteToken = jwt.sign(
        { 
          id: voterFromSession._id.toString(),
          purpose: 'voter-queue-and-vote-session',
          fullName: voterFromSession.fullName,
        },
        process.env.JWT_SECRET_VOTER || 'fallbackVoterQueueSecret!@#$',
        { expiresIn: '1h' }
      );

      res.status(200).json({
        success: true,
        message: 'Face successfully verified. You can now request a voting slot.',
        token: queueAndVoteToken,
      });
    } else {
      return next(new ErrorResponse('Face verification failed. The images do not match.', 401));
    }
  } catch (error: any) {
    console.error('Error calling face verification service:', error.response ? error.response.data : error.message);
    const errorMessage = error.response?.data?.error || 'The face verification service is currently unavailable or could not process the images.';
    return next(new ErrorResponse(errorMessage, 500));
  }
});