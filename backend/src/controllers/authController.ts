import { Request, Response } from 'express'
import { Admin, AdminDocument } from '../models/Admin'
import { generateToken } from '../utils/tokenUtils'

export const loginAdmin = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body

  // ✅ Explicitly tell TypeScript what this is
  const admin = await Admin.findOne({ email }) as AdminDocument | null

  if (!admin || admin.password !== password) {
    res.status(401).json({ message: 'Invalid credentials' })
    return
  }

  // ✅ Now _id is known to exist
  const token = generateToken(admin._id.toString())

  res.status(200).json({
    token,
    admin: {
      id: admin._id,
      email: admin.email,
    },
  })
}
