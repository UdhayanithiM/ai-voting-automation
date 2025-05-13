// server/controllers/authController.ts
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { Officer, OfficerDocument } from '../models/Officer'; // Path to your Officer model
import { Admin, AdminDocument } from '../models/Admin'; // Path to your Admin model
import { Voter } from '../models/Voter'; // Path to your Voter model
import { generateToken } from '../utils/tokenUtils'; // Path to your token utility
import { sendOtpToPhone, verifyOtp } from '../utils/otpUtils'; // Path to your OTP utility

// 🧑‍💼 Admin Login (assuming this is correct as per your notes)
export const loginAdmin = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  console.log(`[Auth] Admin login attempt for email: ${email}`);

  try {
    const admin = (await Admin.findOne({ email })) as AdminDocument | null;

    if (!admin) {
      console.log(`[Auth] Admin login failed: No admin found with email ${email}.`);
      res.status(401).json({ message: 'Invalid credentials - admin not found' });
      return;
    }

    if (!admin.password) {
        console.log(`[Auth] Admin login failed: Admin ${email} has no password set.`);
        res.status(500).json({ message: 'Server configuration error - admin account incomplete.' });
        return;
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    console.log(`[Auth] Password match for admin ${email}: ${isMatch}`);

    if (!isMatch) {
      console.log(`[Auth] Admin login failed: Password mismatch for email ${email}.`);
      res.status(401).json({ message: 'Invalid credentials - password mismatch' });
      return;
    }

    const token = generateToken(admin._id.toString());
    console.log(`[Auth] Admin login successful for ${email}. Token generated.`);

    res.status(200).json({
      token,
      user: { // Consistent 'user' key
        id: admin._id.toString(),
        email: admin.email,
        role: 'admin',
      },
    });
  } catch (err) {
    console.error('[Auth] Admin login error:', err);
    res.status(500).json({ message: 'Server error during admin login' });
  }
};

// 👮 Officer Login (Corrected and with Logging)
export const loginOfficer = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  console.log(`[Auth] Officer login attempt for email: ${email}`);

  try {
    if (!email || !password) {
      console.log('[Auth] Officer login failed: Email or password missing.');
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    const officer = (await Officer.findOne({ email })) as OfficerDocument | null;

    if (!officer) {
      console.log(`[Auth] Officer login failed: No officer found with email ${email}.`);
      // Send a generic message to the client for security, but log details on server
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }
    console.log(`[Auth] Officer found: ${officer.email}, ID: ${officer._id}, Name: ${officer.name}`);
    // console.log(`[Auth] Stored hashed password for ${email}: ${officer.password}`); // For debugging only, remove in prod

    if (!officer.password) {
        console.log(`[Auth] Officer login failed: Officer ${email} has no password set in the database.`);
        res.status(500).json({ message: 'Server configuration error - officer account incomplete.' });
        return;
    }

    const isMatch = await bcrypt.compare(password, officer.password);
    console.log(`[Auth] Password comparison result for ${email}: ${isMatch}`);

    if (!isMatch) {
      console.log(`[Auth] Officer login failed: Password mismatch for email ${email}.`);
      // Send a generic message to the client
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    const token = generateToken(officer._id.toString());
    console.log(`[Auth] Officer login successful for ${email}. Token generated.`);

    res.status(200).json({
      token,
      user: { // Key is 'user'
        id: officer._id.toString(),
        name: officer.name, // Include name
        email: officer.email,
        role: 'officer',
      },
    });
  } catch (err) {
    const error = err as Error;
    console.error('[Auth] Officer login server error:', error.message, error.stack);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// 📲 Send OTP to voter's phone
export const sendOtp = async (req: Request, res: Response) => {
  const { phone } = req.body;
  console.log(`[Auth] OTP send attempt for phone: ${phone}`);

  if (!phone) {
    res.status(400).json({ message: 'Phone is required' });
    return;
  }

  try {
    await sendOtpToPhone(phone);
    console.log(`[Auth] OTP sent successfully to ${phone}.`);
    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (err) {
    const error = err as Error;
    console.error('[Auth] OTP send error:', error.message);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
};

// ✅ Verify OTP and create/fetch voter
export const verifyOtpCode = async (req: Request, res: Response) => {
  const { phone, otp } = req.body;
  console.log(`[Auth] OTP verify attempt for phone: ${phone}`);

  if (!phone || !otp) {
    res.status(400).json({ message: 'Phone and OTP required' });
    return;
  }

  try {
    const valid = await verifyOtp(phone, otp);
    if (!valid) {
      console.log(`[Auth] OTP verification failed for ${phone}: Invalid OTP.`);
      res.status(401).json({ message: 'Invalid OTP' });
      return;
    }
    console.log(`[Auth] OTP verified successfully for ${phone}.`);

    let voter = await Voter.findOne({ phone });
    if (!voter) {
      console.log(`[Auth] No voter found for ${phone}, creating new voter.`);
      voter = await Voter.create({ phone }); // Ensure your Voter model can be created with just a phone initially or adapt
      console.log(`[Auth] New voter created for ${phone} with ID: ${voter._id}.`);
    } else {
      console.log(`[Auth] Existing voter found for ${phone} with ID: ${voter._id}.`);
    }

    const token = generateToken(voter._id.toString());
    console.log(`[Auth] Token generated for voter ${phone}.`);

    res.status(200).json({
      token,
      user: { // Consistent 'user' key
        id: voter._id.toString(),
        phone: voter.phone,
        // name: voter.name, // Include if available and needed
        role: 'voter',
      },
    });
  } catch (err) {
    const error = err as Error;
    console.error('[Auth] OTP verification error:', error.message);
    res.status(500).json({ message: 'Server error during OTP verification' });
  }
};