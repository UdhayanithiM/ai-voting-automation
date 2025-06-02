// backend/src/controllers/adminController.ts
import { Request, Response, NextFunction } from 'express';
import { Officer } from '../models/Officer';
import { Voter, VoterDocument } from '../models/Voter';
import { Vote } from '../models/Vote';
import { CandidateDocument } from '../types'; // Assuming CandidateDocument is defined in types
import mongoose, { Document } from 'mongoose'; // Added Document for PopulatedVote
import ErrorResponse from '../utils/ErrorResponse';
import asyncHandler from '../middleware/asyncHandler';

// GET /api/admin/voters - Fetch all voters
export const getAllVoters = asyncHandler(async (req: Request, res: Response) => {
  const voters = await Voter.find()
    .sort({ createdAt: -1 })
    .select('-password'); // Voter model doesn't have password, but good practice if it did
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
    success: true, // Added for consistency
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
export const getAdminStats = asyncHandler(async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [totalVoters, totalOfficers, totalVotes, pendingVoters] = await Promise.all([
      Voter.countDocuments(),
      Officer.countDocuments(),
      Vote.countDocuments(),
      Voter.countDocuments({ approved: false, flagged: { $ne: true } })
    ]);

    res.status(200).json({
      success: true, // Added for consistency
      totalVoters,
      totalOfficers,
      totalVotes,
      pendingApprovals: pendingVoters
    });
  } catch (error) {
    return next(new ErrorResponse('Failed to retrieve admin statistics', 500));
  }
});

// POST /api/admin/voters/:id/approve - Approve a voter
export const approveVoter = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ErrorResponse('Invalid voter ID format', 400));
  }

  const voter = await Voter.findByIdAndUpdate(
    id,
    {
      approved: true,
      status: 'Verified',
      flagged: false
    },
    { new: true, runValidators: true }
  ).select('-password') as VoterDocument | null;

  if (!voter) {
    return next(new ErrorResponse('Voter not found', 404));
  }

  res.status(200).json({
    success: true, // Added for consistency
    message: 'Voter approved successfully',
    voter: {
      id: voter._id,
      fullName: voter.fullName,
      status: voter.status,
      approved: voter.approved
    }
  });
});

// POST /api/admin/voters/:id/flag - Flag a voter
export const flagVoter = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ErrorResponse('Invalid voter ID format', 400));
  }

  const voter = await Voter.findByIdAndUpdate(
    id,
    {
      flagged: true,
      status: 'Flagged',
      flagReason: reason || 'No reason provided by admin.', // Ensure a default reason
      approved: false // Flagging implies disapproval or need for re-verification
    },
    { new: true, runValidators: true }
  ).select('-password') as VoterDocument | null;

  if (!voter) {
    return next(new ErrorResponse('Voter not found', 404));
  }

  res.status(200).json({
    success: true, // Added for consistency
    message: 'Voter flagged successfully',
    voter: {
      id: voter._id,
      fullName: voter.fullName,
      status: voter.status,
      flagged: voter.flagged,
      flagReason: voter.flagReason
    }
  });
});

// GET /api/admin/votes - Get voting logs
export const getVoteLogs = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
 try {
    interface PopulatedVoteVoter extends Pick<VoterDocument, '_id' | 'fullName' | 'voterIdNumber'> {} // voterIdNumber should be part of VoterDocument
    interface PopulatedVoteCandidate extends Pick<CandidateDocument, '_id' | 'name' | 'position'> {}

    interface PopulatedVote extends Document {
        _id: mongoose.Types.ObjectId;
        voter: PopulatedVoteVoter | null;
        candidate: PopulatedVoteCandidate | null;
        createdAt: Date;
        updatedAt: Date;
    }

    const votes = await Vote.find()
        .sort({ createdAt: -1 })
        .populate<{ voter: PopulatedVoteVoter }>('voter', 'fullName voterIdNumber')
        .populate<{ candidate: PopulatedVoteCandidate }>('candidate', 'name position')
        .lean<PopulatedVote[]>();

    const formattedVotes = votes.map(vote => ({
        id: vote._id.toString(),
        voterId: vote.voter?.voterIdNumber || 'N/A',
        voterName: vote.voter?.fullName || 'Unknown Voter',
        candidateName: vote.candidate?.name || 'Unknown Candidate',
        candidatePosition: vote.candidate?.position || 'N/A',
        timestamp: vote.createdAt
    }));

    res.status(200).json(formattedVotes); // No need to wrap in {success: true}, data itself implies success
  } catch (error) {
    return next(new ErrorResponse('Failed to retrieve vote logs', 500));
  }
});


// **NEW FUNCTION**: POST /api/admin/voters/create-direct - Admin creates and approves a voter
export const createVoterByAdmin = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const {
    fullName,
    dob,
    address,
    phoneNumber,
    aadharNumber,
    voterIdNumber,
    registerNumber,
    photoUrl, // Optional: URL of an uploaded selfie/photo
  } = req.body;

  // 1. Basic Validation
  if (!fullName || !dob || !address || !phoneNumber) {
    return next(new ErrorResponse('Full name, Date of Birth, Address, and Phone Number are required.', 400));
  }
  if (!aadharNumber && !voterIdNumber && !registerNumber) {
    return next(new ErrorResponse('At least one identifier (Aadhaar, Voter ID, or Register Number) is required.', 400));
  }

  // Add more specific validations as in voterController.registerVoter if desired (e.g., regex for phone, Aadhaar length)
  // For example:
  if (aadharNumber && !/^\d{12}$/.test(aadharNumber)) {
      return next(new ErrorResponse('Invalid Aadhaar Number format. Must be 12 digits.', 400));
  }
   if (phoneNumber && !/^\d{10,15}$/.test(phoneNumber)) {
      return next(new ErrorResponse('Invalid phone number format.', 400));
  }


  // 2. Check for existing voter by unique identifiers
  const orQueries: any[] = [];
  if (aadharNumber) orQueries.push({ aadharNumber });
  if (voterIdNumber) orQueries.push({ voterIdNumber: voterIdNumber.toUpperCase() });
  if (registerNumber) orQueries.push({ registerNumber });
  if (phoneNumber) orQueries.push({ phoneNumber }); // Assuming phone should be unique

  if (orQueries.length > 0) {
    const existingVoter = await Voter.findOne({ $or: orQueries });
    if (existingVoter) {
      let matchedFields = [];
      if (aadharNumber && existingVoter.aadharNumber === aadharNumber) matchedFields.push('Aadhaar Number');
      if (voterIdNumber && existingVoter.voterIdNumber === voterIdNumber.toUpperCase()) matchedFields.push('Voter ID');
      if (registerNumber && existingVoter.registerNumber === registerNumber) matchedFields.push('Register Number');
      if (phoneNumber && existingVoter.phoneNumber === phoneNumber) matchedFields.push('Phone Number');
      
      return next(new ErrorResponse(`A voter with the provided ${matchedFields.join(' or ')} already exists. Cannot create duplicate.`, 409));
    }
  }

  // 3. Create new voter with admin-approved status
  const voterData: Partial<VoterDocument> = {
    fullName,
    dob,
    address,
    phoneNumber,
    photoUrl: photoUrl || '',
    approved: true, // Admin created = approved
    status: 'Verified', // Admin created = verified
    hasVoted: false, // Default
  };

  if (aadharNumber) voterData.aadharNumber = aadharNumber;
  if (voterIdNumber) voterData.voterIdNumber = voterIdNumber.toUpperCase();
  if (registerNumber) voterData.registerNumber = registerNumber;

  const newVoter = await Voter.create(voterData);

  res.status(201).json({
    success: true,
    message: 'Voter created and directly approved by admin.',
    voter: { // Return relevant details
        _id: newVoter._id,
        fullName: newVoter.fullName,
        status: newVoter.status,
        approved: newVoter.approved,
    }
  });
});