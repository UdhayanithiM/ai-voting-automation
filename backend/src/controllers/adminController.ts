// backend/src/controllers/adminController.ts
import { Request, Response, NextFunction } from 'express'; // Added NextFunction
import bcrypt from 'bcryptjs'; // Keep for other uses if any, or remove if only model hashes
import { Officer } from '../models/Officer'; // Ensure path is correct
import { Voter } from '../models/Voter';   // Ensure path is correct
import { Vote } from '../models/Vote';     // Ensure path is correct
import { VoterDocument, CandidateDocument } from '../types'; // Ensure path is correct
import mongoose from 'mongoose';
import ErrorResponse from '../utils/ErrorResponse';     // Import ErrorResponse
import asyncHandler from '../middleware/asyncHandler'; // Import asyncHandler

// Utility function for error handling (if not using asyncHandler consistently)
const handleErrorOLD = (res: Response, error: unknown, context: string) => {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  console.error(`Error in ${context}:`, error); // Log the full error
  res.status(500).json({ 
    message: `Failed to ${context}`,
    error: errorMessage 
  });
};

// GET /api/admin/voters - Fetch all voters
export const getAllVoters = asyncHandler(async (req: Request, res: Response) => { // Used asyncHandler
  const voters = await Voter.find()
    .sort({ createdAt: -1 })
    .select('-password'); // Good to exclude password
  res.status(200).json(voters);
});

// POST /api/admin/officers - Create a new officer (CORRECTED)
export const createOfficer = asyncHandler(async (req: Request, res: Response, next: NextFunction) => { // Used asyncHandler
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    // Use ErrorResponse for consistent error handling via your middleware
    return next(new ErrorResponse('All fields (name, email, password) are required', 400));
  }

  // Email will be lowercased by the model's schema option `lowercase: true`
  const existingOfficer = await Officer.findOne({ email }); 
  if (existingOfficer) {
    return next(new ErrorResponse('Officer with this email already exists', 409)); // 409 Conflict is more appropriate
  }

  // ✅ Pass the PLAIN password here. The Officer model's pre('save') hook will hash it.
  const officer = await Officer.create({
    name,
    email,    // Model schema should handle lowercasing and trimming
    password, // Send the plain password directly from the request
  });

  // Officer.create will throw an error if validation fails or save fails, caught by asyncHandler

  res.status(201).json({
    message: 'Officer created successfully',
    officer: { // Send back non-sensitive officer info
      id: officer._id,
      name: officer.name,
      email: officer.email, // This will be the lowercased email from DB
      createdAt: officer.createdAt
    },
  });
});

// GET /api/admin/stats - Get admin dashboard statistics
export const getAdminStats = asyncHandler(async (_req: Request, res: Response) => { // Used asyncHandler
  const [totalVoters, totalOfficers, totalVotes, pendingVoters] = await Promise.all([
    Voter.countDocuments(),
    Officer.countDocuments(),
    Vote.countDocuments(),
    Voter.countDocuments({ approved: false, flagged: { $ne: true } }) // More precise pending
  ]);

  res.status(200).json({ 
    totalVoters, 
    totalOfficers, 
    totalVotes,
    pendingApprovals: pendingVoters
  });
});

// POST /api/voters/:id/approve - Approve a voter
export const approveVoter = asyncHandler(async (req: Request, res: Response, next: NextFunction) => { // Used asyncHandler
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ErrorResponse('Invalid voter ID format', 400));
  }

  const voter = await Voter.findByIdAndUpdate(
    id,
    { 
      approved: true,
      status: 'Verified', // Consistent status
      flagged: false 
    },
    { new: true, runValidators: true } // Return updated doc, run validators
  ).select('-password');

  if (!voter) {
    return next(new ErrorResponse('Voter not found', 404));
  }

  res.status(200).json({ 
    message: 'Voter approved successfully', 
    voter: { // Send back relevant, non-sensitive info
      id: voter._id,
      fullName: voter.fullName,
      status: voter.status,
      approved: voter.approved
    }
  });
});

// POST /api/voters/:id/flag - Flag a voter
export const flagVoter = asyncHandler(async (req: Request, res: Response, next: NextFunction) => { // Used asyncHandler
  const { id } = req.params;
  const { reason } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ErrorResponse('Invalid voter ID format', 400));
  }

  const voter = await Voter.findByIdAndUpdate(
    id,
    { 
      flagged: true,
      status: 'Flagged', // Consistent status
      flagReason: reason || 'No reason provided',
      approved: false 
    },
    { new: true, runValidators: true }
  ).select('-password');

  if (!voter) {
    return next(new ErrorResponse('Voter not found', 404));
  }

  res.status(200).json({ 
    message: 'Voter flagged successfully', 
    voter: { // Send back relevant, non-sensitive info
      id: voter._id,
      fullName: voter.fullName,
      status: voter.status,
      flagged: voter.flagged,
      flagReason: voter.flagReason
    }
  });
});

// GET /api/admin/votes - Get voting logs
export const getVoteLogs = asyncHandler(async (req: Request, res: Response) => { // Used asyncHandler
  const votes = await Vote.find()
    .sort({ createdAt: -1 })
    .populate<{ voter: VoterDocument }>('voter', 'voterIdNumber fullName') // Select specific fields
    .populate<{ candidate: CandidateDocument }>('candidate', 'name position') // Select specific fields
    .lean(); // .lean() for better performance if not modifying docs

  const formattedVotes = votes.map(vote => ({
    id: vote._id,
    voterId: vote.voter?.voterIdNumber || 'N/A', // Use a consistent field like voterIdNumber
    voterName: vote.voter?.fullName || 'Unknown Voter',
    candidateName: vote.candidate?.name || 'Unknown Candidate',
    candidatePosition: vote.candidate?.position || 'N/A',
    timestamp: vote.createdAt
  }));

  res.status(200).json(formattedVotes);
});