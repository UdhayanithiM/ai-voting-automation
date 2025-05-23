// backend/src/controllers/authController.ts

import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Admin, AdminDocument } from '../models/Admin';
import { Officer, OfficerDocument } from '../models/Officer';
import { Voter, VoterDocument } from '../models/Voter';
import { generateToken } from '../utils/tokenUtils';
import { sendOtpToPhone, verifyOtp, clearOtp } from '../utils/otpUtils'; // Your existing import
import ErrorResponse from '../utils/ErrorResponse';
import asyncHandler from '../middleware/asyncHandler';

// --- Unified error logger ---
const handleAuthError = (
    res: Response,
    error: unknown,
    context: string,
    statusCode: number = 500,
    next?: NextFunction
) => {
    const err = error as Error;
    console.error(`[AuthC] Error in ${context}:`, err.message, err.stack);

    if (next && error instanceof ErrorResponse) {
        return next(error);
    }
    if (next && !(error instanceof ErrorResponse)) {
        return next(new ErrorResponse(`Failed during ${context}: ${err.message}`, statusCode));
    }
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

    const isMatch = await (officer as any).comparePassword(password);

    if (!isMatch) {
        return next(new ErrorResponse('Invalid email or password (password mismatch)', 401));
    }

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

// --- MODIFIED Step 1: Voter Identification & OTP Request (Context Aware) ---
export const initiateVoterOtpById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { identifierType, identifierValue } = req.body;

    if (!identifierType || !identifierValue) {
        return next(new ErrorResponse('Identifier type and value are required.', 400));
    }

    let voterQuery: any = {};
    let voterIdentifierForLog = `${identifierType}: ${identifierValue}`;

    if (identifierType === 'AADHAAR') {
        if (!/^\d{12}$/.test(identifierValue)) {
            return next(new ErrorResponse('Invalid Aadhaar Number format. Must be 12 digits.', 400));
        }
        voterQuery = { aadharNumber: identifierValue };
    } else if (identifierType === 'VOTER_ID') {
        if (!/^[A-Z0-9]{6,15}$/.test(identifierValue.toUpperCase())) {
            return next(new ErrorResponse('Invalid Voter ID format.', 400));
        }
        voterQuery = { voterIdNumber: identifierValue.toUpperCase() };
    } else if (identifierType === 'REGISTER_NUMBER') {
        voterQuery = { registerNumber: identifierValue };
    } else {
        return next(new ErrorResponse('Unsupported identifier type provided.', 400));
    }

    const voter: VoterDocument | null = await Voter.findOne(voterQuery);

    if (!voter) {
        console.log(`[AuthC] Voter not found for ${voterIdentifierForLog}`);
        return next(new ErrorResponse(`Voter not found with the provided ${identifierType}. Please check your details or register.`, 404));
    }

    if (voter.hasVoted) {
        return next(new ErrorResponse('This voter has already cast their vote.', 403));
    }

    if (!voter.phoneNumber) {
        console.error(`[AuthC] Missing phone number for voter ID: ${voter._id} (Identified by ${voterIdentifierForLog})`);
        return next(new ErrorResponse('No registered phone number found for this voter. Cannot send OTP.', 500));
    }

    try {
        // ✅ CORRECTED: Call sendOtpToPhone as defined in your otpUtils.ts (expects 1 argument)
        await sendOtpToPhone(voter.phoneNumber); 
        // const otpResult = await sendOtpToPhone(voter.phoneNumber, voter._id.toString()); // OLD Line 164

        console.log(`[AuthC] OTP process initiated for ${voterIdentifierForLog} (Voter ID: ${voter._id}) to phone ${voter.phoneNumber}`);
        res.status(200).json({
            success: true,
            message: 'OTP has been sent to your registered mobile number.',
            phoneHint: voter.phoneNumber.slice(-4),
        });
    } catch (otpError: any) {
        console.error(`[AuthC] Error sending OTP for ${voterIdentifierForLog}:`, otpError);
        return next(new ErrorResponse(otpError.message || 'Failed to send OTP. Please try again.', 500));
    }
});

// --- MODIFIED Step 2: Verify OTP & Generate Voter Session Token (Context Aware) ---
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
        return next(new ErrorResponse('Voter not found for the provided details. Cannot verify OTP.', 404));
    }

    if (!voter.phoneNumber) {
        return next(new ErrorResponse('Phone number missing for this voter.', 500));
    }

    if (voter.hasVoted) {
        return next(new ErrorResponse('This voter has already voted.', 403));
    }

    // ✅ CORRECTED: Call verifyOtp as defined in your otpUtils.ts (expects 2 arguments)
    const isValidOtp = await verifyOtp(voter.phoneNumber, otp);
    // const isValidOtp = await verifyOtp(voter.phoneNumber, otp, voter._id.toString()); // OLD Line 219

    if (!isValidOtp) {
        return next(new ErrorResponse('Invalid or expired OTP.', 401));
    }

    // ✅ CORRECTED: Call clearOtp as defined in your otpUtils.ts (expects 1 argument)
    await clearOtp(voter.phoneNumber); 
    // await clearOtp(voter.phoneNumber, voter._id.toString()); // OLD Line 226

    const otpToken = jwt.sign(
        { id: voter._id.toString(), purpose: 'OTP_VERIFIED_FOR_VOTER_FLOW' },
        process.env.JWT_SECRET_VOTER || 'yourDefaultStrongVoterSecret!IfEnvMissing123',
        { expiresIn: '10m' }
    );

    res.status(200).json({
        success: true,
        message: 'OTP verified. Proceed to face verification.',
        token: otpToken,
        voter: {
            id: voter._id.toString(),
            phone: voter.phoneNumber,
            fullName: voter.fullName,
        },
    });
});