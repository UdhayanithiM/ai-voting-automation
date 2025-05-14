// File: backend/src/utils/tokenUtils.ts
import jwt, { SignOptions, Secret } from 'jsonwebtoken';

/**
 * Generates a JWT, typically for Admin or Officer roles.
 * It uses a general JWT_SECRET from environment variables.
 *
 * @param id The user ID (Admin or Officer ID) to include in the token payload.
 * @returns A signed JWT string.
 * @throws Error if JWT_SECRET is not defined in environment variables.
 */
export const generateToken = (id: string): string => {
  const payload = {
    id: id,
    // You could add a 'role' here if this token is for multiple roles
    // and if your authorization middleware needs to check this role.
  };

  const secretFromEnv: string | undefined = process.env.JWT_SECRET; // General secret for admin/officer
  const expiresInSetting: string | undefined = process.env.JWT_EXPIRES_IN; // e.g., "1d", "7h", "30m" or a number string like "86400"

  if (!secretFromEnv) {
    console.error('FATAL ERROR: JWT_SECRET is not defined in environment variables. Cannot sign admin/officer tokens.');
    throw new Error('JWT signing secret (JWT_SECRET) is not configured on the server.');
  }

  const secretKey: Secret = secretFromEnv;

  const options: SignOptions = {};

  if (expiresInSetting) {
    // expiresIn can be a string (e.g., "1d", "2h") or a number (seconds)
    // We will pass it as is, as jsonwebtoken library handles parsing this string.
    // If it's intended to be purely a number of seconds, ensure it's parsed correctly.
    const expiresInNum = Number(expiresInSetting); // Try to convert to number
    if (!isNaN(expiresInNum) && String(expiresInNum) === expiresInSetting.trim()) {
      // If expiresInSetting is a string that is purely numeric (e.g., "86400")
      options.expiresIn = expiresInNum; // Use as number (seconds)
    } else {
      // Otherwise, assume it's a string like "1d", "24h" that jsonwebtoken can parse
      options.expiresIn = expiresInSetting;
    }
  } else {
    options.expiresIn = '1d'; // Default expiry if not set
  }

  return jwt.sign(payload, secretKey, options);
};
