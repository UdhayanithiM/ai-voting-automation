// backend/src/routes/authRoutes.ts
import express from 'express';
import {
  loginAdmin,
  loginOfficer,
  initiateVoterOtpById, // Assuming this is your function from authController.ts
  verifyVoterIdOtp,     // <<<< This function handles the OTP verification
  // ... any other authentication controller functions you have
} from '../controllers/authController'; // Ensure this path is correct

const router = express.Router();

// --- Admin and Officer Login Routes ---
router.post('/admin/login', loginAdmin);
router.post('/officer/login', loginOfficer);

// --- Voter Authentication Flow (Aadhaar/Register Number based) ---

// Route for VoterIdEntryPage.tsx to request OTP
// Full path will be: POST /api/auth/voter/initiate-otp-by-id
router.post('/voter/initiate-otp-by-id', initiateVoterOtpById);

// Route for VerifyOtpPage.tsx to verify the OTP
// Full path will be: POST /api/auth/voter/verify-id-otp
router.post('/voter/verify-id-otp', verifyVoterIdOtp); // <<<< THIS LINE IS ESSENTIAL

export default router;
