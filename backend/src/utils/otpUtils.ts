// backend/src/utils/otpUtils.ts
const otpStore: Record<string, { otp: string, expiresAt: number }> = {}; // Store OTP with expiry
const OTP_VALIDITY_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export const sendOtpToPhone = async (phone: string): Promise<void> => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + OTP_VALIDITY_DURATION_MS;
  otpStore[phone] = { otp, expiresAt };
  console.log(`🔐 OTP for ${phone}: ${otp} (Expires at: ${new Date(expiresAt).toLocaleTimeString()})`); // For testing/demo
  // In a real app: await twilioClient.messages.create({ body: `Your OTP is ${otp}`, from: 'yourTwilioNumber', to: phone });
};

export const verifyOtp = async (phone: string, submittedOtp: string): Promise<boolean> => {
  const storedEntry = otpStore[phone];
  if (!storedEntry) {
    console.log(`[OTP] No OTP found for phone: ${phone}`);
    return false; // No OTP was generated or it was cleared
  }
  if (Date.now() > storedEntry.expiresAt) {
    console.log(`[OTP] OTP expired for phone: ${phone}`);
    delete otpStore[phone]; // Clean up expired OTP
    return false;
  }
  if (storedEntry.otp === submittedOtp) {
    // Do NOT delete here yet if you want to allow retries within validity.
    // Deletion should happen AFTER successful use in the controller (see clearOtp).
    return true;
  }
  console.log(`[OTP] Invalid OTP for phone: ${phone}. Expected ${storedEntry.otp}, got ${submittedOtp}`);
  return false;
};

// NEW function to explicitly clear OTP after successful verification
export const clearOtp = async (phone: string): Promise<void> => {
    if (otpStore[phone]) {
        delete otpStore[phone];
        console.log(`[OTP] OTP cleared for phone: ${phone} after successful use.`);
    }
};