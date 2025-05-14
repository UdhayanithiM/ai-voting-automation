// backend/src/controllers/voteController.ts
import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import asyncHandler from '../middleware/asyncHandler';
import ErrorResponse from '../utils/ErrorResponse';
import { Voter, VoterDocument } from '../models/Voter'; // Using your NAMED exports
import { Candidate, CandidateDocument } from '../models/Candidate'; // Using your NAMED exports

/**
 * @desc    Cast a vote for a candidate
 * @route   POST /api/v1/vote  (Ensure your API prefix matches, e.g., /api/v1)
 * @access  Private (Requires voter session token, protected by protectVoterSession)
 */
export const castVote = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { candidateId } = req.body;

  // req.voter should be populated by the protectVoterSession middleware
  if (!req.voter || !req.voter._id) {
    // This should ideally be caught by protectVoterSession, but as a safeguard
    return next(new ErrorResponse('Voter authentication failed. Please log in again.', 401));
  }
  const voterId = req.voter._id;

  // Validate candidateId
  if (!candidateId) {
    return next(new ErrorResponse('Please select a candidate to vote for.', 400));
  }
  if (!mongoose.Types.ObjectId.isValid(candidateId)) {
    return next(new ErrorResponse(`Invalid candidate ID format: ${candidateId}`, 400));
  }

  // Start a MongoDB session for an atomic transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Fetch the voter within the transaction and check if already voted
    const voter = await Voter.findById(voterId).session(session);

    if (!voter) {
      // This case should be rare if protectVoterSession is working correctly
      await session.abortTransaction();
      session.endSession();
      return next(new ErrorResponse('Voter not found. Please try authenticating again.', 404));
    }

    if (voter.hasVoted) {
      await session.abortTransaction();
      session.endSession();
      return next(new ErrorResponse('You have already cast your vote for this election.', 403)); // 403 Forbidden
    }

    // 2. Fetch the candidate within the transaction
    const candidate = await Candidate.findById(candidateId).session(session);

    if (!candidate) {
      await session.abortTransaction();
      session.endSession();
      return next(new ErrorResponse(`Candidate with ID ${candidateId} not found.`, 404));
    }

    // 3. Perform the vote: Update voter and candidate atomically
    voter.hasVoted = true;
    await voter.save({ session }); // Make sure to pass the session

    candidate.voteCount += 1;
    await candidate.save({ session }); // Make sure to pass the session

    // If all operations are successful, commit the transaction
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: `Vote successfully cast for ${candidate.name}. Thank you for voting!`,
      data: {
        voterId: voter._id,
        candidateId: candidate._id,
        candidateName: candidate.name,
        updatedVoteCountForCandidate: candidate.voteCount,
      },
    });
  } catch (error) {
    // If any error occurs, abort the transaction
    await session.abortTransaction();
    session.endSession();
    console.error('Error during vote casting transaction:', error);
    // Pass a generic server error to the client
    next(new ErrorResponse('Failed to cast vote due to a server error. Please try again.', 500));
  }
});
