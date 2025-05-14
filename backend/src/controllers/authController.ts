// backend/src/controllers/authController.ts
import { Request, Response, NextFunction } from 'express'; // Added NextFunction
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { Admin, AdminDocument } from '../models/Admin';
import { Officer, OfficerDocument } from '../models/Officer';
import { Voter, VoterDocument } from '../models/Voter'; // Your named import

import { generateToken } from '../utils/tokenUtils'; // Assumes this is for Admin/Officer
import { sendOtpToPhone, verifyOtp, clearOtp } from '../utils/otpUtils';
import ErrorResponse from '../utils/ErrorResponse';     // Assuming you have this utility
import asyncHandler from '../middleware/asyncHandler'; // Assuming you have this utility

// --- Unified error logger --- // No changes needed here if it works for you
const handleAuthError = (
  res: Response,
  error: unknown,
  context: string,
  statusCode: number = 500,
  next?: NextFunction // Optional next for asyncHandler pattern
) => {
  const err = error as Error;
  console.error(`[AuthC] Error in ${context}:`, err.message, err.stack);
  if (next && error instanceof ErrorResponse) { // If using asyncHandler, pass to it
      return next(error);
  }
  if (next && !(error instanceof ErrorResponse)) {
      return next(new ErrorResponse(`Failed during ${context}: ${err.message}`, statusCode));
  }
  // Fallback if next is not provided (though with asyncHandler it always should be)
  res.status(statusCode).json({
    success: false,
    message: `Failed during ${context}`,
    error: err.message,
  });
};


// --- Admin Login ---
export const loginAdmin = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorResponse('Email and password are required', 400));
  }

  const admin: AdminDocument | null = await Admin.findOne({ email }).select('+password'); // Ensure password is selected if not by default
  if (!admin || !admin.password) {
    return next(new ErrorResponse('Invalid email or password (admin not found or password field missing)', 401));
  }

  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) {
    return next(new ErrorResponse('Invalid email or password (password mismatch)', 401));
  }

  // Uses generateToken from tokenUtils, which should use process.env.JWT_SECRET
  const token = generateToken(admin._id.toString());

  res.status(200).json({
    success: true,
    token,
    user: { id: admin._id.toString(), email: admin.email, role: 'admin' },
  });
});

// --- Officer Login ---
export const loginOfficer = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorResponse('Email and password are required', 400));
  }

  const officer: OfficerDocument | null = await Officer.findOne({ email }).select('+password');
  if (!officer || !officer.password) {
    return next(new ErrorResponse('Invalid email or password (officer not found or password field missing)', 401));
  }

  // Assuming Officer model has a comparePassword method
  const isMatch = await (officer as any).comparePassword(password);
  if (!isMatch) {
    return next(new ErrorResponse('Invalid email or password (password mismatch)', 401));
  }

  // Uses generateToken from tokenUtils, which should use process.env.JWT_SECRET
  const token = generateToken(officer._id.toString());

  res.status(200).json({
    success: true,
    token,
    user: {
      id: officer._id.toString(),
      name: officer.name,
      email: officer.email,
      role: 'officer',
    },
  });
});

// --- Step 1: Voter Identification & OTP Request (Aadhaar/RegNo based) ---
export const initiateVoterOtpById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { aadharNumber, registerNumber } = req.body;

  if (!aadharNumber || !registerNumber) {
    return next(new ErrorResponse('Aadhaar number and Register number are required.', 400));
  }

  const voter: VoterDocument | null = await Voter.findOne({ aadharNumber, registerNumber });

  if (!voter) {
    return next(new ErrorResponse('Voter not found. Please check your details.', 404));
  }

  if (voter.hasVoted) {
    return next(new ErrorResponse('This voter has already cast their vote.', 403));
  }

  if (!voter.phoneNumber) {
    console.error(`[AuthC] Missing phone number for Aadhaar: ${aadharNumber}`);
    return next(new ErrorResponse('Voter phone number missing. Contact support.', 500));
  }

  await sendOtpToPhone(voter.phoneNumber); // From otpUtils - this should handle OTP generation and storage

  res.status(200).json({
    success: true, // Explicitly send success: true
    message: 'OTP has been sent to your registered mobile number.',
    phoneHint: voter.phoneNumber.slice(-4), // Helpful for the user
  });
});

// --- Step 2: Verify OTP & Generate Voter Session Token ---
export const verifyVoterIdOtp = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { aadharNumber, registerNumber, otp } = req.body;

  if (!aadharNumber || !registerNumber || !otp) {
    return next(new ErrorResponse('All fields (Aadhaar, RegNo, OTP) are required.', 400));
  }

  const voter: VoterDocument | null = await Voter.findOne({ aadharNumber, registerNumber });

  if (!voter) {
    return next(new ErrorResponse('Voter not found. Cannot verify OTP.', 404));
  }

  if (!voter.phoneNumber) {
    return next(new ErrorResponse('Phone number missing for this voter.', 500));
  }

  if (voter.hasVoted) {
    return next(new ErrorResponse('This voter has already voted.', 403));
  }

  const isValidOtp = await verifyOtp(voter.phoneNumber, otp); // From otpUtils
  if (!isValidOtp) {
    return next(new ErrorResponse('Invalid or expired OTP.', 401));
  }

  await clearOtp(voter.phoneNumber); // From otpUtils

  // Generate Voter Session JWT using JWT_SECRET_VOTER
  const voterSessionToken = jwt.sign(
    { id: voter._id.toString() }, // Payload MUST contain 'id' for protectVoterSession
    process.env.JWT_SECRET_VOTER || 'yourDefaultStrongVoterSecret!IfEnvMissing123', // Use dedicated voter secret
    { expiresIn: '15m' } // Short-lived session token for next steps
  );

  res.status(200).json({
    success: true, // CRUCIAL for frontend logic
    message: 'OTP verified. Proceed to face verification.',
    token: voterSessionToken, // CRUCIAL: Key is 'token'
    voter: { // CRUCIAL: Key is 'voter'
      id: voter._id.toString(),
      phone: voter.phoneNumber, // Map VoterDocument.phoneNumber to 'phone'
    },
  });
});
