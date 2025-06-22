// backend/src/controllers/voterController.ts

import { Request, Response, NextFunction } from 'express';
import { Voter } from '../models/Voter';
import asyncHandler from '../middleware/asyncHandler';
import ErrorResponse from '../utils/ErrorResponse';

// POST /api/voters - Register a new voter (from self-registration)
export const registerVoter = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // CORRECTED: Destructure all the fields sent from the frontend registration form
  const {
    fullName,
    dob,
    address,
    phoneNumber,
    aadharNumber,
    voterIdNumber,
    registerNumber,
    photoUrl, // This was previously named 'selfie' in the old logic
  } = req.body;

  // Basic validation to ensure required fields are present
  if (!fullName || !dob || !address || !phoneNumber) {
    return next(new ErrorResponse('Missing required registration fields', 400));
  }

  // --- Check for existing voter (this logic is important to prevent duplicates) ---
  const orQueries: any[] = [];
  if (aadharNumber) orQueries.push({ aadharNumber });
  if (voterIdNumber) orQueries.push({ voterIdNumber: voterIdNumber.toUpperCase() });
  if (registerNumber) orQueries.push({ registerNumber });
  if (phoneNumber) orQueries.push({ phoneNumber });

  if (orQueries.length > 0) {
    const existingVoter = await Voter.findOne({ $or: orQueries });
    if (existingVoter) {
      return next(new ErrorResponse('A voter with one of the provided identifiers already exists.', 409));
    }
  }
  // --- End of duplicate check ---

  const newVoter = await Voter.create({
    fullName,
    dob,
    address,
    phoneNumber,
    aadharNumber: aadharNumber || undefined,
    voterIdNumber: voterIdNumber ? voterIdNumber.toUpperCase() : undefined,
    registerNumber: registerNumber || undefined,
    photoUrl: photoUrl || '',
    // Default values are handled by the schema (approved: false, status: 'Pending', etc.)
  });

  res.status(201).json({
    success: true,
    message: 'Voter registered successfully. Your application is pending review.',
    voter: {
      _id: newVoter._id,
      fullName: newVoter.fullName,
      status: newVoter.status,
    },
  });
});

// GET /api/voters - Get all voters (for admin)
export const getAllVoters = asyncHandler(async (req: Request, res: Response) => {
  try {
    const voters = await Voter.find().sort({ createdAt: -1 });
    res.status(200).json(voters);
  } catch (error) {
    console.error('Error fetching voters:', error);
    res.status(500).json({ message: 'Failed to fetch voters' });
  }
});