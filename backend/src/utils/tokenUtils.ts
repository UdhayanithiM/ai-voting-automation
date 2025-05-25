// backend/src/utils/tokenUtils.ts
import jwt, { SignOptions, Secret } from 'jsonwebtoken';

// Ensure JWT_SECRET and JWT_EXPIRES_IN are loaded from .env
// For example, using dotenv.config() in your main server file if not already.

export const generateToken = (id: string, role: string): string => {
  const payload = {
    id: id,
    role: role, // CRUCIAL: Add role to the payload
  };

  const secretFromEnv: string | undefined = process.env.JWT_SECRET;
  const expiresInSettingFromEnv: string | undefined = process.env.JWT_EXPIRES_IN;

  if (!secretFromEnv) {
    console.error('FATAL ERROR: JWT_SECRET is not defined in environment variables. Cannot sign tokens.');
    throw new Error('JWT signing secret (JWT_SECRET) is not configured on the server.');
  }

  const secretKey: Secret = secretFromEnv;
  const options: SignOptions = {};

  if (expiresInSettingFromEnv && expiresInSettingFromEnv.trim() !== '') {
    const trimmedExpiresIn = expiresInSettingFromEnv.trim();
    // Check if it's a string representation of a number (e.g., "3600" for seconds)
    const numericExpiresIn = Number(trimmedExpiresIn);
    if (!isNaN(numericExpiresIn) && String(numericExpiresIn) === trimmedExpiresIn) {
      options.expiresIn = numericExpiresIn; // Use as number (seconds)
    } else {
      options.expiresIn = trimmedExpiresIn; // Use as string (e.g., "1d", "7h")
    }
  } else {
    options.expiresIn = '1d'; // Default expiry if not set or empty
  }

  return jwt.sign(payload, secretKey, options);
};