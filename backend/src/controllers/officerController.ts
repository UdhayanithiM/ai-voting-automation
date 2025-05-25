// backend/src/controllers/officerController.ts
import { Request, Response, NextFunction } from 'express'; // Added NextFunction if you use error handling middleware like asyncHandler
import bcrypt from 'bcryptjs';
import { Officer, OfficerDocument } from '../models/Officer';
import { generateToken } from '../utils/tokenUtils';
import ErrorResponse from '../utils/ErrorResponse'; // Assuming you might use this for consistency
import asyncHandler from '../middleware/asyncHandler'; // Assuming you use this

// If this loginOfficer is intended to be used and not the one in authController.ts
// Wrap with asyncHandler if you have async operations and want centralized error handling
export const loginOfficer = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // try { // asyncHandler handles the try-catch block
    const { email, password } = req.body;

    if (!email || !password) {
      // Forward to error handler or return directly if not using asyncHandler for all routes
      return next(new ErrorResponse('Email and password are required', 400));
    }

    const officer = await Officer.findOne({ email }).select('+password'); // Ensure password is selected for comparison

    if (!officer) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    // Make sure comparePassword method exists on your Officer model or use bcrypt directly
    // Assuming Officer model has comparePassword method like Admin model
    const isMatch = await officer.comparePassword(password); 
    
    if (!isMatch) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    // CORRECTED: Pass the 'officer' role as the second argument
    const token = generateToken(officer._id.toString(), 'officer'); 

    res.status(200).json({
      success: true, // Added for consistency with other login responses
      token,
      officer: {
        id: officer._id.toString(), // Ensure ID is a string
        name: officer.name,
        email: officer.email,
        role: 'officer', // Include role in the response user object
      },
    });
  // } catch (error) { // asyncHandler handles this
  //  console.error('Login error:', error);
  //  next(error); // Forward to global error handler
  // }
});