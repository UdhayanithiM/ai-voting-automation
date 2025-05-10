// backend/src/utils/otpUtils.ts
const otpStore: Record<string, string> = {}

export const sendOtpToPhone = async (phone: string): Promise<void> => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  otpStore[phone] = otp
  console.log(`🔐 OTP for ${phone}: ${otp}`) // For testing/demo
}

export const verifyOtp = async (phone: string, otp: string): Promise<boolean> => {
  return otpStore[phone] === otp
}
