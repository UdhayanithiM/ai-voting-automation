// backend/src/middleware/authMiddleware.ts
import { Request as ExpressRequest, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';
// Import VoterDocument if you intend to populate req.voter fully from DB in protectVoterSession
// import { VoterDocument } from '../models/Voter'; 

export interface DecodedUserPayload {
    id: string;
    role?: string; // Role is crucial
}

export interface VoterStepTokenPayload {
    id: string;
    purpose: string;
    fullName?: string;
    iat?: number;
    exp?: number;
}

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
    };
    // voter?: VoterDocument | null; // If protectVoterSession populates this
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;
    let token;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    }

    if (!token) {
        // Ensure void return type by not returning the response directly
        res.status(401).json({ success: false, message: 'Not authorized, no token provided.' });
        return; 
    }

    try {
        const generalSecret = process.env.JWT_SECRET;
        if (!generalSecret) {
            console.error('[AuthMW - protect] JWT_SECRET for admin/officer is not defined.');
            res.status(500).json({ success: false, message: 'Server configuration error: JWT_SECRET missing.' });
            return;
        }

        const decoded = jwt.verify(token, generalSecret) as DecodedUserPayload;
        
        if (typeof decoded.role === 'undefined') {
            console.warn(`[AuthMW - protect] Forbidden: Token for user ${decoded.id} is missing 'role' information. Path: ${req.originalUrl}`);
            res.status(403).json({ success: false, message: 'Forbidden: Role information missing in token.' });
            return;
        }
        
        req.user = decoded;
        
        // Example: Check if the request is for an admin route based on req.baseUrl
        // This assumes your admin routes are mounted like app.use('/api/admin', adminRoutes);
        // req.baseUrl would then be '/api/admin' for requests handled by adminRoutes.
        if (req.baseUrl === '/api/admin') { 
            if (decoded.role !== 'admin') {
                 console.warn(`[AuthMW - protect] Forbidden: User ${decoded.id} with role '${decoded.role}' attempted to access admin path: ${req.originalUrl}`);
                 res.status(403).json({ success: false, message: 'Forbidden: Admin access required.' });
                 return;
            }
        }
        // Example for officer routes if this middleware were shared and distinction needed here:
        // else if (req.baseUrl === '/api/officer') { 
        //     if (decoded.role !== 'officer') {
        //          console.warn(`[AuthMW - protect] Forbidden: User ${decoded.id} with role '${decoded.role}' attempted to access officer path: ${req.originalUrl}`);
        //          res.status(403).json({ success: false, message: 'Forbidden: Officer access required.' });
        //          return;
        //     }
        // }
        
        next();
    } catch (error) {
        let errorMessage = 'Not authorized, token failed.';
        const e = error as jwt.JsonWebTokenError; 
        if (e.name === 'TokenExpiredError') {
            errorMessage = 'Not authorized, token expired.';
        } else if (e.name === 'JsonWebTokenError') { 
            errorMessage = `Not authorized, token invalid: ${e.message}.`;
        }
        console.error(`[AuthMW - protect] Auth Error: ${e.name} - ${e.message}. Path: ${req.originalUrl}`);
        res.status(401).json({ success: false, message: errorMessage });
        return;
    }
};

export const protectVoterStepSession = (expectedPurpose: string) => {
    return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        const authHeader = req.headers.authorization;
        const context = `Voter session protection for purpose: ${expectedPurpose}`;
        let token;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }

        if (!token) {
            console.log(`[AuthMW - ${context}] No session token or invalid format.`);
            res.status(401).json({ success: false, message: 'No session token provided or invalid authorization format.' });
            return;
        }

        try {
            const voterStepSecret = process.env.JWT_SECRET_VOTER;
            if (!voterStepSecret) { 
                console.error(`[AuthMW - ${context}] JWT_SECRET_VOTER for voter steps is not defined.`);
                res.status(500).json({ success: false, message: 'Server configuration error (JWT_SECRET_VOTER missing).' });
                return;
            }
            const decoded = jwt.verify(token, voterStepSecret) as VoterStepTokenPayload;

            if (decoded.purpose !== expectedPurpose) {
                console.log(`[AuthMW - ${context}] Invalid token purpose. Expected '${expectedPurpose}', got '${decoded.purpose}'. VoterId: ${decoded.id}`);
                res.status(403).json({ success: false, message: 'Invalid session token purpose. Please restart the verification process.' });
                return;
            }

            req.voterSession = {
                voterId: decoded.id,
                purpose: decoded.purpose,
                fullName: decoded.fullName,
            };
            next();
        } catch (error) {
            const e = error as jwt.JsonWebTokenError;
            let errorMessage = 'Invalid or malformed session token. Please restart the process.';
             if (e.name === 'TokenExpiredError') {
                console.log(`[AuthMW - ${context}] Session token expired for VoterId: ${(e as any).payload?.id || 'unknown'}.`);
                errorMessage = 'Session token has expired. Please restart the verification process.';
            } else if (e.name === 'JsonWebTokenError') {
                 console.error(`[AuthMW - ${context}] JWT Error: ${e.message}. VoterId from token (if parsable): ${(e as any).payload?.id || 'unknown'}.`);
                 errorMessage = `Invalid session token (${e.message}). Please restart the process.`;
            } else {
                console.error(`[AuthMW - ${context}] Error verifying session token:`, e.message);
            }
            res.status(401).json({ success: false, message: errorMessage });
            return;
        }
    };
};