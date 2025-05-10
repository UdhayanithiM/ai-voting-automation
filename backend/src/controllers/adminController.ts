import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { Officer } from '../models/Officer';
import { Voter } from '../models/Voter';
import { Vote } from '../models/Vote';
import { VoterDocument, CandidateDocument } from '../types'; // Add this import
import mongoose from 'mongoose';

// Utility function for error handling
const handleError = (res: Response, error: unknown, context: string) => {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  console.error(`Error in ${context}:`, error);
  res.status(500).json({ 
    message: `Failed to ${context}`,
    error: errorMessage 
  });
};

// GET /api/admin/voters - Fetch all voters
export const getAllVoters = async (req: Request, res: Response): Promise<void> => {
  try {
    const voters = await Voter.find()
      .sort({ createdAt: -1 })
      .select('-password');
    res.status(200).json(voters);
  } catch (error) {
    handleError(res, error, 'fetch voters');
  }
};

// POST /api/admin/officers - Create a new officer
export const createOfficer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ message: 'All fields (name, email, password) are required' });
      return;
    }

    const existingOfficer = await Officer.findOne({ email });
    if (existingOfficer) {
      res.status(409).json({ message: 'Officer with this email already exists' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const officer = await Officer.create({
      name,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      message: 'Officer created successfully',
      officer: {
        id: officer._id,
        name: officer.name,
        email: officer.email,
        createdAt: officer.createdAt
      },
    });
  } catch (error) {
    handleError(res, error, 'create officer');
  }
};

// GET /api/admin/stats - Get admin dashboard statistics
export const getAdminStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [totalVoters, totalOfficers, totalVotes, pendingVoters] = await Promise.all([
      Voter.countDocuments(),
      Officer.countDocuments(),
      Vote.countDocuments(),
      Voter.countDocuments({ approved: false })
    ]);

    res.status(200).json({ 
      totalVoters, 
      totalOfficers, 
      totalVotes,
      pendingApprovals: pendingVoters
    });
  } catch (error) {
    handleError(res, error, 'fetch admin stats');
  }
};

// POST /api/voters/:id/approve - Approve a voter
export const approveVoter = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const voter = await Voter.findByIdAndUpdate(
      id,
      { 
        approved: true,
        status: 'Verified',
        flagged: false 
      },
      { new: true }
    );

    if (!voter) {
      res.status(404).json({ message: 'Voter not found' });
      return;
    }

    res.status(200).json({ 
      message: 'Voter approved successfully', 
      voter: {
        id: voter._id,
        fullName: voter.fullName,
        status: voter.status
      }
    });
  } catch (error) {
    handleError(res, error, 'approve voter');
  }
};

// POST /api/voters/:id/flag - Flag a voter
export const flagVoter = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Validate the ID first
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: 'Invalid voter ID format' });
      return;
    }

    const voter = await Voter.findByIdAndUpdate(
      id,
      { 
        $set: { // Use $set operator for clarity
          flagged: true,
          status: 'Flagged',
          flagReason: reason || 'No reason provided',
          approved: false // Ensure flagged voters are not approved
        }
      },
      { 
        new: true, // Return the updated document
        runValidators: true // Run schema validators on update
      }
    ).select('-password'); // Exclude sensitive data

    if (!voter) {
      res.status(404).json({ message: 'Voter not found' });
      return;
    }

    res.status(200).json({ 
      message: 'Voter flagged successfully', 
      voter: {
        id: voter._id,
        fullName: voter.fullName,
        status: voter.status,
        flagReason: voter.flagReason
      }
    });
  } catch (error) {
    console.error('Error flagging voter:', error);
    res.status(500).json({ 
      message: 'Failed to flag voter',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
// GET /api/admin/votes - Get voting logs
export const getVoteLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const votes = await Vote.find()
      .sort({ createdAt: -1 })
      .populate<{ voter: VoterDocument }>('voter')
      .populate<{ candidate: CandidateDocument }>('candidate')
      .lean();

    const formattedVotes = votes.map(vote => ({
      id: vote._id,
      voterId: vote.voter?.voterId || 'Unknown',
      voterName: vote.voter?.fullName || 'Unknown',
      candidate: vote.candidate?.name || 'Unknown',
      position: vote.candidate?.position || 'Unknown',
      timestamp: vote.createdAt
    }));

    res.status(200).json(formattedVotes);
  } catch (error) {
    handleError(res, error, 'fetch vote logs');
  }
};