// backend/src/controllers/adminController.ts
import { Request, Response, NextFunction } from 'express';
// import bcrypt from 'bcryptjs'; // Not used in this snippet
import { Officer } from '../models/Officer';
import { Voter, VoterDocument } from '../models/Voter';   // CRITICAL: Ensure VoterDocument here defines all fields you use.
import { Vote } from '../models/Vote';     
import { CandidateDocument } from '../types'; // Ensure this type from '../types' is correct
import mongoose from 'mongoose';
import ErrorResponse from '../utils/ErrorResponse';     
import asyncHandler from '../middleware/asyncHandler'; 

// GET /api/admin/voters - Fetch all voters
export const getAllVoters = asyncHandler(async (req: Request, res: Response) => {
  const voters = await Voter.find()
    .sort({ createdAt: -1 })
    .select('-password'); 
  res.status(200).json(voters);
});

// POST /api/admin/officers - Create a new officer
export const createOfficer = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return next(new ErrorResponse('All fields (name, email, password) are required', 400));
  }
  const normalizedEmail = email.toLowerCase();
  const existingOfficer = await Officer.findOne({ email: normalizedEmail }); 
  if (existingOfficer) {
    return next(new ErrorResponse('Officer with this email already exists', 409));
  }

  const officer = await Officer.create({ name, email, password }); // Password hashing is in Officer model pre-save hook

  res.status(201).json({
    message: 'Officer created successfully',
    officer: { 
      id: officer._id,
      name: officer.name,
      email: officer.email, 
      createdAt: officer.createdAt
    },
  });
});

// GET /api/admin/stats - Get admin dashboard statistics
export const getAdminStats = asyncHandler(async (_req: Request, res: Response, next: NextFunction) => { // Added next
  try {
    const [totalVoters, totalOfficers, totalVotes, pendingVoters] = await Promise.all([
      Voter.countDocuments(),
      Officer.countDocuments(),
      Vote.countDocuments(),
      // Ensure 'approved' and 'flagged' fields exist in your Voter schema for this query
      Voter.countDocuments({ approved: false, flagged: { $ne: true } }) 
    ]);

    res.status(200).json({ 
      totalVoters, 
      totalOfficers, 
      totalVotes,
      pendingApprovals: pendingVoters
    });
  } catch (error) {
    // Forward error to global error handler
    return next(new ErrorResponse('Failed to retrieve admin statistics', 500));
  }
});

// POST /api/admin/voters/:id/approve - Approve a voter
export const approveVoter = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ErrorResponse('Invalid voter ID format', 400));
  }

  // Ensure VoterDocument type includes 'approved', 'status', 'flagged'
  const voter = await Voter.findByIdAndUpdate(
    id,
    { 
      approved: true,   // Fix: VoterDocument must define 'approved'
      status: 'Verified', // Fix: VoterDocument must define 'status'
      flagged: false      // Fix: VoterDocument must define 'flagged'
    },
    { new: true, runValidators: true } 
  ).select('-password') as VoterDocument | null; // Explicit cast after select

  if (!voter) {
    return next(new ErrorResponse('Voter not found', 404));
  }

  res.status(200).json({ 
    message: 'Voter approved successfully', 
    voter: { 
      id: voter._id,
      fullName: voter.fullName,
      // The following will cause TS errors if not in VoterDocument
      status: voter.status,     // Fix: VoterDocument must define 'status'
      approved: voter.approved  // Fix: VoterDocument must define 'approved'
    }
  });
});

// POST /api/admin/voters/:id/flag - Flag a voter
export const flagVoter = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { reason } = req.body; // Ensure 'reason' is expected and handled if required

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ErrorResponse('Invalid voter ID format', 400));
  }

  // Ensure VoterDocument type includes 'flagged', 'status', 'flagReason', 'approved'
  const voter = await Voter.findByIdAndUpdate(
    id,
    { 
      flagged: true,         // Fix: VoterDocument must define 'flagged'
      status: 'Flagged',     // Fix: VoterDocument must define 'status'
      flagReason: reason || 'No reason provided', // Fix: VoterDocument must define 'flagReason'
      approved: false        // Fix: VoterDocument must define 'approved'
    },
    { new: true, runValidators: true }
  ).select('-password') as VoterDocument | null; // Explicit cast

  if (!voter) {
    return next(new ErrorResponse('Voter not found', 404));
  }

  res.status(200).json({ 
    message: 'Voter flagged successfully', 
    voter: { 
      id: voter._id,
      fullName: voter.fullName,
      // The following will cause TS errors if not in VoterDocument
      status: voter.status,       // Fix: VoterDocument must define 'status'
      flagged: voter.flagged,     // Fix: VoterDocument must define 'flagged'
      flagReason: voter.flagReason// Fix: VoterDocument must define 'flagReason' (make it optional in type if it can be undefined)
    }
  });
});

// GET /api/admin/votes - Get voting logs
export const getVoteLogs = asyncHandler(async (req: Request, res: Response, next: NextFunction) => { // Added next
 try {
    // Define a more specific type for the populated voter within the vote context
    interface PopulatedVoteVoter extends Pick<VoterDocument, '_id' | 'fullName'> {
        voterIdNumber?: string; // Add this if it's indeed part of your VoterDocument and selected
    }
    interface PopulatedVoteCandidate extends Pick<CandidateDocument, '_id' | 'name' | 'position'> {}

    interface PopulatedVote extends Document { // Assuming Vote itself is a Mongoose Document
        _id: mongoose.Types.ObjectId;
        voter: PopulatedVoteVoter | null; // Voter can be null if population fails or ID is invalid
        candidate: PopulatedVoteCandidate | null;
        createdAt: Date;
        updatedAt: Date;
    }

    const votes = await Vote.find()
        .sort({ createdAt: -1 })
        // Correct population: Ensure 'voterIdNumber' and 'fullName' are in Voter schema and selected
        .populate<{ voter: PopulatedVoteVoter }>('voter', 'fullName voterIdNumber') 
        .populate<{ candidate: PopulatedVoteCandidate }>('candidate', 'name position')
        .lean<PopulatedVote[]>(); // Use lean with the specific type

    const formattedVotes = votes.map(vote => ({
        id: vote._id.toString(),
        voterId: vote.voter?.voterIdNumber || 'N/A', // Fix: Access 'voterIdNumber' from PopulatedVoteVoter
        voterName: vote.voter?.fullName || 'Unknown Voter',
        candidateName: vote.candidate?.name || 'Unknown Candidate',
        candidatePosition: vote.candidate?.position || 'N/A',
        timestamp: vote.createdAt
    }));

    res.status(200).json(formattedVotes);
  } catch (error) {
    return next(new ErrorResponse('Failed to retrieve vote logs', 500));
  }
});