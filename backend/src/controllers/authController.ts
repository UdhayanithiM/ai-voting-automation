// backend/src/controllers/authController.ts
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Admin, AdminDocument } from '../models/Admin'; // Assuming AdminDocument defines _id
import { Officer, OfficerDocument } from '../models/Officer'; // Assuming OfficerDocument defines _id and name
import { Voter, VoterDocument } from '../models/Voter'; // Ensure VoterDocument defines _id, fullName, photoUrl
import { generateToken } from '../utils/tokenUtils';
import { sendOtpToPhone, verifyOtp, clearOtp } from '../utils/otpUtils';

// --- Helper for consistent error logging and response ---
const handleAuthError = (res: Response, error: unknown, context: string, statusCode: number = 500) => {
    const err = error as Error;
    console.error(`[AuthC] Error in ${context}:`, err.message);
    // This function sends the response, so the caller doesn't need to return its result
    res.status(statusCode).json({ message: `Failed during ${context}`, error: err.message });
};

// --- Admin Login ---
export const loginAdmin = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;
    const context = "admin login";
    console.log(`[AuthC] ${context} attempt for email: ${email}`);
    try {
        if (!email || !password) {
            res.status(400).json({ message: 'Email and password are required' });
            return; // Early exit
        }
        // Explicitly type the result of findOne
        const admin: AdminDocument | null = await Admin.findOne({ email }); 
        if (!admin || !admin.password) {
            res.status(401).json({ message: 'Invalid email or password' });
            return; // Early exit
        }
        
        const isMatch = await bcrypt.compare(password, admin.password); // Assuming Admin model has pre-save hook or password was pre-hashed
        if (!isMatch) {
            console.log(`[AuthC] Password mismatch for admin ${email}.`);
            res.status(401).json({ message: 'Invalid email or password' });
            return; // Early exit
        }
        // admin._id should now be correctly typed
        const token = generateToken(admin._id.toString()); 
        console.log(`[AuthC] ${context} successful for ${email}.`);
        res.status(200).json({ // Final response, no 'return' needed before this
            token,
            user: { id: admin._id.toString(), email: admin.email, role: 'admin' },
        });
    } catch (error) {
        handleAuthError(res, error, context); // handleAuthError sends the response
    }
};

// --- Officer Login ---
export const loginOfficer = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;
    const context = "officer login";
    console.log(`[AuthC] ${context} attempt for email: ${email}`);
    try {
        if (!email || !password) {
            res.status(400).json({ message: 'Email and password are required' });
            return;
        }
        // Explicitly type the result of findOne
        const officer: OfficerDocument | null = await Officer.findOne({ email }); 
        if (!officer || !officer.password) {
            res.status(401).json({ message: 'Invalid email or password' });
            return;
        }
        const isMatch = await officer.comparePassword(password); // Uses method from Officer model
        if (!isMatch) {
            console.log(`[AuthC] Password mismatch for officer ${email}.`);
            res.status(401).json({ message: 'Invalid email or password' });
            return;
        }
        // officer._id and officer.name should now be correctly typed
        const token = generateToken(officer._id.toString()); 
        console.log(`[AuthC] ${context} successful for ${email}.`);
        res.status(200).json({
            token,
            user: { id: officer._id.toString(), name: officer.name, email: officer.email, role: 'officer' },
        });
    } catch (error) {
        handleAuthError(res, error, context);
    }
};

// --- Voter Identification & OTP Request by ID ---
export const initiateVoterOtpById = async (req: Request, res: Response): Promise<void> => {
  const { aadharNumber, registerNumber } = req.body;
  const context = "voter OTP initiation by ID";
  console.log(`[AuthC] ${context} for Aadhaar: ${aadharNumber}, RegisterNo: ${registerNumber}`);

  if (!aadharNumber || !registerNumber) {
    res.status(400).json({ message: 'Aadhaar number and Register number are required.' });
    return;
  }

  try {
    const voter: VoterDocument | null = await Voter.findOne({ aadharNumber, registerNumber });

    if (!voter) {
      console.log(`[AuthC] No voter found for Aadhaar: ${aadharNumber}, RegisterNo: ${registerNumber}.`);
      res.status(404).json({ message: 'Voter not found with provided details. Please ensure you are registered correctly.' });
      return;
    }

    if (voter.hasVoted) {
        console.log(`[AuthC] OTP initiation attempt for already voted voter: ${aadharNumber}`);
        res.status(403).json({ message: 'This voter has already cast their vote and cannot initiate a new session.' });
        return;
    }

    if (!voter.phoneNumber) {
        console.error(`[AuthC] CRITICAL: Phone number missing for voter Aadhaar: ${aadharNumber}. Cannot send OTP.`);
        res.status(500).json({ message: 'Registered phone number not found for this voter. Please contact support.' });
        return;
    }
    
    await sendOtpToPhone(voter.phoneNumber);
    
    console.log(`[AuthC] OTP sent to phone number associated with Aadhaar: ${aadharNumber}. (OTP logged by otpUtils for dev)`);
    res.status(200).json({ 
        message: `OTP has been sent to your registered mobile number.`,
        contextIdentifiers: { aadharNumber, registerNumber } 
    });

  } catch (error) {
    handleAuthError(res, error, context);
  }
};

// --- Verify OTP for ID-based flow & Issue Face Verification Token ---
export const verifyVoterIdOtp = async (req: Request, res: Response): Promise<void> => {
  const { aadharNumber, registerNumber, otp } = req.body;
  const context = "voter ID OTP verification";
  console.log(`[AuthC] ${context} for Aadhaar: ${aadharNumber}, RegNo: ${registerNumber} with OTP: ${otp ? otp.substring(0,2) + '****' : 'N/A'}`);

  if (!aadharNumber || !registerNumber || !otp) {
    res.status(400).json({ message: 'Aadhaar number, Register number, and OTP are required.' });
    return;
  }

  try {
    const voter: VoterDocument | null = await Voter.findOne({ aadharNumber, registerNumber });

    if (!voter) {
      console.log(`[AuthC] Voter not found during OTP verification for Aadhaar: ${aadharNumber}.`);
      res.status(404).json({ message: 'Voter not found. Cannot verify OTP.' });
      return;
    }
    if (!voter.phoneNumber) { 
        console.error(`[AuthC] CRITICAL: Phone number missing for voter Aadhaar: ${aadharNumber} during OTP verify.`);
        res.status(500).json({ message: 'Internal error: Voter phone details missing for OTP verification.' });
        return;
    }
    if (voter.hasVoted) {
        console.log(`[AuthC] OTP verification attempt for already voted voter: ${aadharNumber}`);
        res.status(403).json({ message: 'This voter has already cast their vote.' });
        return;
    }

    const isValidOtp = await verifyOtp(voter.phoneNumber, otp);

    if (!isValidOtp) {
      console.log(`[AuthC] Invalid OTP for Aadhaar: ${aadharNumber}.`);
      res.status(401).json({ message: 'Invalid OTP or OTP has expired.' });
      return;
    }
    console.log(`[AuthC] OTP successfully verified for Aadhaar: ${aadharNumber}.`);

    await clearOtp(voter.phoneNumber);

    const faceVerificationPurpose = 'voter-face-verification-session';
    // voter._id, voter.aadharNumber, voter.registerNumber, etc. are now correctly typed
    const faceVerificationSessionToken = jwt.sign(
        { 
            voterId: voter._id.toString(), 
            purpose: faceVerificationPurpose,
            aadharNumber: voter.aadharNumber, 
            registerNumber: voter.registerNumber
        }, 
        process.env.JWT_SECRET!, 
        { expiresIn: '10m' } 
    );

    res.status(200).json({
      message: 'OTP verified successfully. Please proceed to face verification.',
      sessionToken: faceVerificationSessionToken, 
      voterInfo: { 
        id: voter._id.toString(), // Now correctly typed
        fullName: voter.fullName,
        photoUrl: voter.photoUrl 
      }
    });

  } catch (error) {
    handleAuthError(res, error, context);
  }
};