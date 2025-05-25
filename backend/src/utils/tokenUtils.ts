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
  const expiresInSetting: string | undefined = process.env.JWT_EXPIRES_IN;

  if (!secretFromEnv) {
    console.error('FATAL ERROR: JWT_SECRET is not defined in environment variables. Cannot sign tokens.');
    throw new Error('JWT signing secret (JWT_SECRET) is not configured on the server.');
  }

  const secretKey: Secret = secretFromEnv;
  const options: SignOptions = {};

  if (expiresInSetting) {
    const numericExpiresIn = Number(expiresInSetting);
    if (!isNaN(numericExpiresIn) && String(numericExpiresIn) === expiresInSetting.trim()) {
        options.expiresIn = numericExpiresIn; 
    } else {
        options.expiresIn = expiresInSetting; 
    }
  } else {
    options.expiresIn = '1d'; // Default expiry
  }

  return jwt.sign(payload, secretKey, options);
};