// File: backend/src/utils/tokenUtils.ts
import jwt, { SignOptions, Secret } from 'jsonwebtoken';

export const generateToken = (id: string): string => {
  const payload = {
    id: id,
  };

  const secretFromEnv: string | undefined = process.env.JWT_SECRET;
  const expiresInSetting: string | undefined = process.env.JWT_EXPIRES_IN;

  if (!secretFromEnv) {
    console.error('FATAL ERROR: JWT_SECRET is not defined in environment variables. Cannot sign admin/officer tokens.');
    // ✅ Correction: Throwing an error here is good, but the function might still try to return if not handled properly.
    // However, the main issue might not be the throw itself but what jwt.sign does if secret is compromised.
    // More importantly, ensure this secret is a good, strong string in your .env file.
    throw new Error('JWT signing secret (JWT_SECRET) is not configured on the server.');
  }

  const secretKey: Secret = secretFromEnv; // This is fine.

  const options: SignOptions = {};

  if (expiresInSetting) {
    const expiresInNum = Number(expiresInSetting); 
    if (!isNaN(expiresInNum) && String(expiresInNum) === expiresInSetting.trim()) {
      options.expiresIn = expiresInNum; 
    } else {
      options.expiresIn = expiresInSetting; // e.g., "7d"
    }
  } else {
    options.expiresIn = '1d'; // Default expiry
  }

  // ✅ This is where the token is made.
  return jwt.sign(payload, secretKey, options);
};