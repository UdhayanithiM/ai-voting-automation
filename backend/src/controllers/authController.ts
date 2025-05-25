// backend/src/controllers/authController.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Admin, AdminDocument } from '../models/Admin';
import { Officer, OfficerDocument } from '../models/Officer'; // Assuming Officer model is used elsewhere or for consistency
import { Voter, VoterDocument } from '../models/Voter';       // Assuming Voter model is used elsewhere
import { generateToken } from '../utils/tokenUtils';
import { sendOtpToPhone, verifyOtp, clearOtp } from '../utils/otpUtils';
import ErrorResponse from '../utils/ErrorResponse';
import asyncHandler from '../middleware/asyncHandler';

// --- Admin Login ---
export const loginAdmin = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new ErrorResponse('Email and password are required', 400));
    }

    // Explicitly type admin with the comparePassword method if it's on AdminDocument
    const admin = await Admin.findOne({ email }).select('+password') as (AdminDocument & { comparePassword?: (pwd: string) => Promise<boolean> }) | null;

    if (!admin || !admin.password) {
        return next(new ErrorResponse('Invalid email or password (admin not found or password field missing)', 401));
    }

    let isMatch: boolean;
    if (typeof admin.comparePassword === 'function') {
        isMatch = await admin.comparePassword(password);
    } else {
        // Fallback or if comparePassword is not on Admin model for some reason
        isMatch = await bcrypt.compare(password, admin.password);
    }

    if (!isMatch) {
        return next(new ErrorResponse('Invalid email or password (password mismatch)', 401));
    }

    // Pass admin ID AND the role 'admin' to generateToken
    const token = generateToken(admin._id.toString(), 'admin'); // <<< CRUCIAL: Pass 'admin' role

    res.status(200).json({
        success: true,
        token,
        // Ensure the user object in the response also contains the role
        user: { id: admin._id.toString(), email: admin.email, role: 'admin' },
    });
});

// --- Officer Login (Ensure role 'officer' is passed if you have a similar structure) ---
export const loginOfficer = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return next(new ErrorResponse('Email and password are required', 400));
    }
    const normalizedEmail = email.toLowerCase().trim();
    const officer = await Officer.findOne({ email: normalizedEmail }).select('+password') as OfficerDocument | null;

    if (!officer || !officer.password) {
        return next(new ErrorResponse('Invalid credentials (officer not found)', 401));
    }
    const isMatch = await officer.comparePassword(password);
    if (!isMatch) {
        return next(new ErrorResponse('Invalid credentials (password mismatch)', 401));
    }
    const token = generateToken(officer._id.toString(), 'officer'); // Pass 'officer' role
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

// ... (rest of your authController, like initiateVoterOtpById, verifyVoterIdOtp) ...
// Ensure voter tokens also get a 'voter' role if needed by other middleware
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
        voterQuery = { voterIdNumber: identifierValue.toUpperCase() };
    } else if (identifierType === 'REGISTER_NUMBER') {
        voterQuery = { registerNumber: identifierValue };
    } else {
        return next(new ErrorResponse('Unsupported identifier type provided.', 400));
    }
    const voter: VoterDocument | null = await Voter.findOne(voterQuery);
    if (!voter) {
        return next(new ErrorResponse('Voter not found.', 404));
    }
    if (voter.hasVoted) {
        return next(new ErrorResponse('This voter has already cast their vote.', 403));
    }
    if (!voter.phoneNumber) {
        return next(new ErrorResponse('Phone number missing for this voter.', 500));
    }
    try {
        await sendOtpToPhone(voter.phoneNumber);
        res.status(200).json({
            success: true,
            message: 'OTP has been sent to your registered mobile number.',
            phoneHint: voter.phoneNumber.slice(-4),
        });
    } catch (otpError) {
        next(new ErrorResponse('Failed to send OTP', 500, otpError instanceof Error ? otpError.message : String(otpError)));
    }
});

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
        return next(new ErrorResponse('Voter not found.', 404));
    }
    if (!voter.phoneNumber) {
        return next(new ErrorResponse('Phone number missing for this voter.', 500));
    }
    if (voter.hasVoted) {
        return next(new ErrorResponse('This voter has already voted.', 403));
    }
    try {
        const isValidOtp = await verifyOtp(voter.phoneNumber, otp);
        if (!isValidOtp) {
            return next(new ErrorResponse('Invalid or expired OTP.', 401));
        }
        await clearOtp(voter.phoneNumber);
        const otpTokenPayload = { id: voter._id.toString(), purpose: 'OTP_VERIFIED_FOR_VOTER_FLOW', role: 'voter' }; // Added role: 'voter'
        const voterJwtSecret = process.env.JWT_SECRET_VOTER || 'yourDefaultStrongVoterSecret!IfEnvMissing123';
         if (voterJwtSecret === 'yourDefaultStrongVoterSecret!IfEnvMissing123' && process.env.NODE_ENV !== 'test') {
            console.warn('[AuthC] verifyVoterIdOtp: Using default JWT_SECRET_VOTER. This is insecure for production.');
        }
        const otpToken = jwt.sign(otpTokenPayload, voterJwtSecret, { expiresIn: '10m' });
        res.status(200).json({
            success: true,
            message: 'OTP verified. Proceed to face verification.',
            token: otpToken,
            voter: { 
                id: voter._id.toString(),
                fullName: voter.fullName, 
            },
        });
    } catch (error) {
        next(new ErrorResponse('OTP verification failed', 500, error instanceof Error ? error.message : String(error)));
    }
});