import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface AuthRequest extends Request {
  user?: any
}

// Return type must be void | Promise<void>
export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization

  // Step 1: Check if Authorization header exists and starts with 'Bearer '
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'No token provided or invalid authorization format' })
    return
  }

  // Step 2: Extract the token from the header
  const token = authHeader.split(' ')[1]

  if (!token) {
    res.status(401).json({ message: 'Token missing from Authorization header' })
    return
  }

  try {
    // Step 3: Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!)

    // Step 4: Attach the decoded user information to the request object
    req.user = decoded

    // Step 5: Move to the next middleware
    next()
  } catch (error) {
    console.error('Error verifying token:', error)
    res.status(403).json({ message: 'Invalid token or token expired' })
  }
}
