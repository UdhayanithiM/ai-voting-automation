// backend/src/middleware/protectVoterSession.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import asyncHandler from './asyncHandler'; // Assuming you have this
import ErrorResponse from '../utils/ErrorResponse'; // Assuming you have this
import { Voter, VoterDocument } from '../models/Voter'; // Using your NAMED exports

// Extend the Express Request interface to include the voter property
declare global {
  namespace Express {
    interface Request {
      voter?: VoterDocument | null; // Or just VoterDocument if you ensure it's always found
    }
  }
}

export const protectVoterSession = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Make sure token exists
    if (!token) {
      return next(new ErrorResponse('Not authorized to access this route (No token)', 401));
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET_VOTER || 'yourVoterJwtSecret') as jwt.JwtPayload;

      // Check if the payload has voterId (or whatever you put in the voter JWT)
      if (!decoded.id) {
        return next(new ErrorResponse('Not authorized, token failed (missing ID)', 401));
      }

      // Find the voter by ID from the token
      // Using your named export 'Voter' for the model
      req.voter = await Voter.findById(decoded.id);

      if (!req.voter) {
        return next(new ErrorResponse('Not authorized, voter not found for this token', 401));
      }

      next(); // Proceed to the next middleware or controller
    } catch (err) {
      console.error('Token verification error:', err);
      return next(new ErrorResponse('Not authorized, token failed', 401));
    }
  }
);
