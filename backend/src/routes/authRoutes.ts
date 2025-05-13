// backend/src/routes/authRoutes.ts
import express from 'express';
import {
  loginAdmin,
  loginOfficer,
  initiateVoterOtpById,  // NEW: For Aadhaar/RegNo based OTP request
  verifyVoterIdOtp       // NEW: For verifying OTP in the new flow
  // Old OTP routes can be removed or commented if this new flow is the primary one
  // sendOtp,
  // verifyOtpCode,
} from '../controllers/authController'; // Ensure functions are exported from here

const router = express.Router();

// Admin and Officer Login (standard email/password + JWT)
router.post('/admin/login', loginAdmin);
router.post('/officer/login', loginOfficer);

// New Voter Identification and OTP Flow (ID -> OTP -> Session Token for Face Verify)
router.post('/voter/initiate-identification-otp', initiateVoterOtpById);
router.post('/voter/verify-identification-otp', verifyVoterIdOtp);

export default router;