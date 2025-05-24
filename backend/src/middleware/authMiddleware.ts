import { Request as ExpressRequest, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';

// For general Admin/Officer JWT payload
interface DecodedUserPayload {
    id: string;
    role?: string; // Ensure role is part of your admin/officer JWT payload if used by protect
}

// For specific voter step-by-step session token payloads
interface VoterStepTokenPayload {
    id: string; // Matches the 'id' field in the JWT payload from verifyFaceStub
    purpose: string;
    fullName?: string;
    // aadharNumber?: string; // Only if you add it to the token payload
    // registerNumber?: string; // Only if you add it to the token payload
    iat?: number;
    exp?: number;
}

// Make AuthRequest generic to align with Express's Request type
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
        return; // Added return
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
        res.status(401).json({ message: 'Full authentication token missing.' });
        return; // Added return
    }
    try {
        const generalSecret = process.env.JWT_SECRET;
        if (!generalSecret) {
            console.error('[AuthMW - protect] JWT_SECRET for admin/officer is not defined.');
            res.status(500).json({ message: 'Server configuration error (JWT_SECRET missing).' });
            return; // Added return
        }
        const decoded = jwt.verify(token, generalSecret) as DecodedUserPayload;
        req.user = decoded;
        next();
    } catch (error) {
        console.error('[AuthMW - protect] Error verifying full auth token:', (error as Error).message);
        res.status(401).json({ message: 'Invalid or expired full authentication token.' });
        return; // Added return
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
            return; // Added return
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            console.log(`[AuthMW - ${context}] Session token missing.`);
            res.status(401).json({ message: 'Session token missing from Authorization header.' });
            return; // Added return
        }

        try {
            const voterStepSecret = process.env.JWT_SECRET_VOTER || 'fallbackVoterQueueSecret!@#$';
            if (!voterStepSecret) {
                console.error(`[AuthMW - ${context}] JWT_SECRET_VOTER for voter steps is not defined.`);
                res.status(500).json({ message: 'Server configuration error (JWT_SECRET_VOTER missing).' });
                return; // Added return
            }
            const decoded = jwt.verify(token, voterStepSecret) as VoterStepTokenPayload;

            if (decoded.purpose !== expectedPurpose) {
                console.log(`[AuthMW - ${context}] Invalid token purpose. Expected '${expectedPurpose}', got '${decoded.purpose}'. Token id: ${decoded.id}`);
                res.status(403).json({ message: 'Invalid session token purpose. Please restart the verification process.' });
                return; // Added return
            }

            req.voterSession = {
                voterId: decoded.id, // Use the 'id' from token payload
                purpose: decoded.purpose,
                fullName: decoded.fullName,
            };
            console.log(`[AuthMW - ${context}] Session token verified for voterId: ${decoded.id}. Proceeding...`);
            next();
        } catch (error) {
            const e = error as Error;
            if (e.name === 'TokenExpiredError') {
                console.log(`[AuthMW - ${context}] Session token expired.`);
                res.status(401).json({ message: 'Session token has expired. Please restart the verification process.' });
            } else if (e.name === 'JsonWebTokenError') {
                 console.error(`[AuthMW - ${context}] JWT Error (e.g. secret mismatch, malformed token):`, e.message);
                 res.status(401).json({ message: 'Invalid session token. Please restart the process. (JWT Error)' });
            } else {
                console.error(`[AuthMW - ${context}] Error verifying session token:`, e.message);
                res.status(401).json({ message: 'Invalid or malformed session token. Please restart the process.' });
            }
            return; // Added return for all catch paths that send a response
        }
    };
};