// backend/src/controllers/authController.ts

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken'; // Used for voter OTP token, and potentially by generateToken
import bcrypt from 'bcryptjs'; // Used by loginAdmin, keep for that
import { Admin, AdminDocument } from '../models/Admin';
import { Officer, OfficerDocument } from '../models/Officer'; // Corrected path if needed
import { Voter, VoterDocument } from '../models/Voter';     // Corrected path if needed
import { generateToken } from '../utils/tokenUtils';         // Ensure this path is correct
import { sendOtpToPhone, verifyOtp, clearOtp } from '../utils/otpUtils'; // Ensure this path is correct
import ErrorResponse from '../utils/ErrorResponse';       // Ensure this path is correct
import asyncHandler from '../middleware/asyncHandler';   // Ensure this path is correct

// --- Unified error logger (from your provided code) ---
const handleAuthError = (
    res: Response,
    error: unknown,
    context: string,
    statusCode: number = 500,
    next?: NextFunction
) => {
    const err = error as Error;
    // It's good practice to log the error stack for more detailed debugging
    console.error(`[AuthC] Error in ${context}: ${err.message}`, err.stack);

    if (next) { // Prefer to always use the next middleware for error handling
        if (error instanceof ErrorResponse) {
            return next(error);
        }
        return next(new ErrorResponse(`Failed during ${context}: ${err.message}`, statusCode));
    }
    // Fallback if next is not provided (though with asyncHandler, next should always be available)
    return res.status(statusCode).json({
        success: false,
        message: `Failed during ${context}`,
        error: err.message,
    });
};

// --- Admin Login (from your provided code) ---
export const loginAdmin = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new ErrorResponse('Email and password are required', 400));
    }

    const admin: AdminDocument | null = await Admin.findOne({ email }).select('+password');

    if (!admin || !admin.password) {
        return next(new ErrorResponse('Invalid email or password (admin not found or password field missing)', 401));
    }

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
        return next(new ErrorResponse('Invalid email or password (password mismatch)', 401));
    }

    const token = generateToken(admin._id.toString());

    res.status(200).json({
        success: true,
        token,
        user: { id: admin._id.toString(), email: admin.email, role: 'admin' },
    });
});

// --- Officer Login (Corrected and Refined) ---
export const loginOfficer = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    // 1. Basic input validation
    if (!email || !password) {
        console.error('[AuthC] loginOfficer: Email or password was not provided in the request body.'); 
        return next(new ErrorResponse('Email and password are required', 400));
    }

    // 2. Normalize email (lowercase and trim)
    const normalizedEmail = email.toLowerCase().trim();
    
    // 3. Find officer by normalized email and select password
    // Note: The Officer model now stores emails in lowercase due to `lowercase: true` in schema.
    const officer: OfficerDocument | null = await Officer.findOne({ email: normalizedEmail }).select('+password');

    // 4. Check if officer exists and has a password field (which should be guaranteed by .select('+password') if officer exists and password is set)
    if (!officer || !officer.password) { 
        // This is where your error at line 85 could be if officer not found or password somehow not selected/present.
        // Logging the specific email helps confirm if it's a "not found" issue.
        console.warn(`[AuthC] loginOfficer: Officer not found or password missing for normalized email: "${normalizedEmail}"`);
        return next(new ErrorResponse('Invalid credentials', 401));
    }

    // 5. Compare password using the model's method
    const isMatch = await officer.comparePassword(password); 

    if (!isMatch) {
        // This is where your error at line 85 could be if passwords don't match.
        console.warn(`[AuthC] loginOfficer: Password mismatch for officer: "${officer.email}"`);
        return next(new ErrorResponse('Invalid credentials', 401));
    }

    // 6. Generate token using your utility (ensure tokenUtils.ts uses JWT_SECRET from .env)
    const token = generateToken(officer._id.toString()); 

    console.log(`[AuthC] loginOfficer: Login successful for officer: "${officer.email}"`);
    res.status(200).json({
        success: true,
        token,
        user: {
            id: officer._id.toString(),
            name: officer.name,
            email: officer.email, // This will be the lowercase email from the DB
            role: 'officer',
        },
    });
});

// --- Voter OTP Request (from your provided code) ---
export const initiateVoterOtpById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { identifierType, identifierValue } = req.body;

    if (!identifierType || !identifierValue) {
        return next(new ErrorResponse('Identifier type and value are required.', 400));
    }

    let voterQuery: any = {};

    if (identifierType === 'AADHAAR') {
        if (!/^\d{12}$/.test(identifierValue)) {
            return next(new ErrorResponse('Invalid Aadhaar Number format. Must be 12 digits.', 400));
        }
        voterQuery = { aadharNumber: identifierValue };
    } else if (identifierType === 'VOTER_ID') {
        // Consider normalizing voterIdNumber (e.g., toUpperCase) before saving if you do it here before querying
        voterQuery = { voterIdNumber: identifierValue.toUpperCase() };
    } else if (identifierType === 'REGISTER_NUMBER') {
        voterQuery = { registerNumber: identifierValue };
    } else {
        return next(new ErrorResponse('Unsupported identifier type provided.', 400));
    }

    const voter: VoterDocument | null = await Voter.findOne(voterQuery);

    if (!voter) {
        // It's good to log the identifier for which the voter was not found
        console.warn(`[AuthC] initiateVoterOtpById: Voter not found for ${identifierType}: "${identifierValue}"`);
        return next(new ErrorResponse('Voter not found.', 404));
    }

    if (voter.hasVoted) {
        return next(new ErrorResponse('This voter has already cast their vote.', 403));
    }

    if (!voter.phoneNumber) {
        console.error(`[AuthC] initiateVoterOtpById: Phone number missing for voter ID: ${voter._id}`);
        return next(new ErrorResponse('Phone number missing for this voter.', 500));
    }

    try {
        await sendOtpToPhone(voter.phoneNumber); // Assuming sendOtpToPhone is robust and handles its own errors or throws them
        console.log(`[AuthC] initiateVoterOtpById: OTP sent to voter ${voter._id} phone hint ${voter.phoneNumber.slice(-4)}`);
        res.status(200).json({
            success: true,
            message: 'OTP has been sent to your registered mobile number.',
            phoneHint: voter.phoneNumber.slice(-4),
        });
    } catch (otpError) {
        console.error('[AuthC] initiateVoterOtpById: Error sending OTP:', otpError);
        // Ensure ErrorResponse is used for consistency if otpError is not already one
        if (otpError instanceof ErrorResponse) return next(otpError);
        if (otpError instanceof Error) return next(new ErrorResponse(otpError.message, 500));
        return next(new ErrorResponse('Failed to send OTP', 500));
    }
});

// --- Voter OTP Verification (from your provided code) ---
export const verifyVoterIdOtp = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { identifierType, identifierValue, otp } = req.body;

    if (!identifierType || !identifierValue || !otp) {
        return next(new ErrorResponse('Identifier type, value, and OTP are required.', 400));
    }

    let voterQuery: any = {};
    if (identifierType === 'AADHAAR') {
        voterQuery = { aadharNumber: identifierValue };
    } else if (identifierType === 'VOTER_ID') {
        voterQuery = { voterIdNumber: identifierValue.toUpperCase() };
    } else if (identifierType === 'REGISTER_NUMBER') {
        voterQuery = { registerNumber: identifierValue };
    } else {
        return next(new ErrorResponse('Unsupported identifier type for OTP verification.', 400));
    }

    const voter: VoterDocument | null = await Voter.findOne(voterQuery);

    if (!voter) {
        console.warn(`[AuthC] verifyVoterIdOtp: Voter not found for ${identifierType}: "${identifierValue}"`);
        return next(new ErrorResponse('Voter not found.', 404));
    }

    if (!voter.phoneNumber) { // Should ideally not happen if OTP was sent
        console.error(`[AuthC] verifyVoterIdOtp: Phone number missing for voter ID: ${voter._id}`);
        return next(new ErrorResponse('Phone number missing for this voter.', 500));
    }

    if (voter.hasVoted) {
        return next(new ErrorResponse('This voter has already voted.', 403));
    }

    try {
        const isValidOtp = await verifyOtp(voter.phoneNumber, otp); // Assuming verifyOtp is robust

        if (!isValidOtp) {
            console.warn(`[AuthC] verifyVoterIdOtp: Invalid OTP for voter ${voter._id} phone ${voter.phoneNumber}`);
            return next(new ErrorResponse('Invalid or expired OTP.', 401));
        }

        await clearOtp(voter.phoneNumber); // Assuming clearOtp is robust

        const otpTokenPayload = { id: voter._id.toString(), purpose: 'OTP_VERIFIED_FOR_VOTER_FLOW', role: 'voter' }; // Added role
        const voterJwtSecret = process.env.JWT_SECRET_VOTER || 'yourDefaultStrongVoterSecret!IfEnvMissing123';
        if (voterJwtSecret === 'yourDefaultStrongVoterSecret!IfEnvMissing123') {
            console.warn('[AuthC] verifyVoterIdOtp: Using default JWT_SECRET_VOTER. This is insecure for production.');
        }
        const otpToken = jwt.sign(otpTokenPayload, voterJwtSecret, { expiresIn: '10m' });

        console.log(`[AuthC] verifyVoterIdOtp: OTP verified for voter ${voter._id}. Token generated.`);
        res.status(200).json({
            success: true,
            message: 'OTP verified. Proceed to face verification.',
            token: otpToken,
            voter: { // Send necessary, non-sensitive voter info
                id: voter._id.toString(),
                // Consider if phone and fullName are needed by frontend at this stage
                // phone: voter.phoneNumber, 
                // fullName: voter.fullName,
            },
        });
    } catch (error) {
        console.error('[AuthC] verifyVoterIdOtp: Error during OTP verification process:', error);
        if (error instanceof ErrorResponse) return next(error);
        if (error instanceof Error) return next(new ErrorResponse(error.message, 500));
        return next(new ErrorResponse('OTP verification failed', 500));
    }
});