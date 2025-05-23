// backend/src/utils/otpUtils.ts
// THIS FILE IS CORRECT AS PER ITS OWN DEFINITIONS.
// NO CHANGES NEEDED HERE TO FIX THE TYPESCRIPT ERRORS IN authController.ts,
// AS THE FIX IS TO CHANGE HOW authController.ts CALLS THESE FUNCTIONS.

const otpStore: Record<string, { otp: string, expiresAt: number }> = {}; // Store OTP with expiry
const OTP_VALIDITY_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export const sendOtpToPhone = async (phone: string): Promise<void> => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + OTP_VALIDITY_DURATION_MS;
  otpStore[phone] = { otp, expiresAt };
  console.log(`🔐 OTP for ${phone}: ${otp} (Expires at: ${new Date(expiresAt).toLocaleTimeString()})`);
};

export const verifyOtp = async (phone: string, submittedOtp: string): Promise<boolean> => {
  const storedEntry = otpStore[phone];
  if (!storedEntry) {
    console.log(`[OTP] No OTP found for phone: ${phone}`);
    return false; 
  }
  if (Date.now() > storedEntry.expiresAt) {
    console.log(`[OTP] OTP expired for phone: ${phone}`);
    delete otpStore[phone]; 
    return false;
  }
  if (storedEntry.otp === submittedOtp) {
    return true;
  }
  console.log(`[OTP] Invalid OTP for phone: ${phone}. Expected ${storedEntry.otp}, got ${submittedOtp}`);
  return false;
};

export const clearOtp = async (phone: string): Promise<void> => {
    if (otpStore[phone]) {
        delete otpStore[phone];
        console.log(`[OTP] OTP cleared for phone: ${phone} after successful use.`);
    }
};