// backend/src/middleware/authMiddleware.ts
import { Request as ExpressRequest, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';

// For general Admin/Officer JWT payload
interface DecodedUserPayload {
    id: string;
    role?: string;
    // Add other common fields from your general admin/officer JWT if any
}

// For specific voter step-by-step session token payloads
// This should match the payload you create in verificationController.ts for queueAndVoteToken
// and in authController.ts for faceVerificationSessionToken
interface VoterStepTokenPayload {
    voterId: string;
    purpose: string;
    fullName?: string; // Ensure this is in the JWT payload if used
    aadharNumber?: string;
    registerNumber?: string;
    iat?: number;
    exp?: number;
}

// Make AuthRequest generic to align with Express's Request type
// P = ParamsDictionary (URL params), ResBody = Response Body, ReqBody = Request Body, ReqQuery = ParsedQs
export interface AuthRequest<
    P = ParamsDictionary,
    ResBody = any,
    ReqBody = any,
    ReqQuery = ParsedQs,
    Locals extends Record<string, any> = Record<string, any>
> extends ExpressRequest<P, ResBody, ReqBody, ReqQuery, Locals> {
    user?: DecodedUserPayload; 
    voterSession?: { 
        voterId: string;
        purpose: string;
        fullName?: string; 
        aadharNumber?: string;
        registerNumber?: string;
    };
}

// General protect middleware for Admin/Officer
export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ message: 'No full authentication token provided or invalid format.' });
        return;
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
        res.status(401).json({ message: 'Full authentication token missing.' });
        return;
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedUserPayload; 
        req.user = decoded; 
        next();
    } catch (error) {
        console.error('[AuthMW] Error verifying full auth token:', (error as Error).message);
        res.status(401).json({ message: 'Invalid or expired full authentication token.' });
    }
};

// Middleware for specific voter step-by-step session tokens
export const protectVoterStepSession = (expectedPurpose: string) => {
    return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        const authHeader = req.headers.authorization;
        const context = `voter session protection for purpose: ${expectedPurpose}`;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log(`[AuthMW - ${context}] No session token or invalid format.`);
            res.status(401).json({ message: 'No session token provided or invalid authorization format.' });
            return;
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            console.log(`[AuthMW - ${context}] Session token missing.`);
            res.status(401).json({ message: 'Session token missing from Authorization header.' });
            return;
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as VoterStepTokenPayload;
            
            if (decoded.purpose !== expectedPurpose) {
                console.log(`[AuthMW - ${context}] Invalid token purpose. Expected '${expectedPurpose}', got '${decoded.purpose}'. Token voterId: ${decoded.voterId}`);
                res.status(403).json({ message: 'Invalid session token purpose. Please restart the verification process.' });
                return;
            }
            
            req.voterSession = { 
                voterId: decoded.voterId, 
                purpose: decoded.purpose,
                fullName: decoded.fullName, // Populate fullName
                aadharNumber: decoded.aadharNumber,
                registerNumber: decoded.registerNumber
            };
            console.log(`[AuthMW - ${context}] Session token verified for voterId: ${decoded.voterId}.`);
            next();
        } catch (error) {
            const e = error as Error;
            if (e.name === 'TokenExpiredError') {
                console.log(`[AuthMW - ${context}] Session token expired.`);
                res.status(401).json({ message: 'Session token has expired. Please restart the verification process.' });
            } else {
                console.error(`[AuthMW - ${context}] Error verifying session token:`, e.message);
                res.status(401).json({ message: 'Invalid or malformed session token. Please restart the process.' });
            }
        }
    };
};
