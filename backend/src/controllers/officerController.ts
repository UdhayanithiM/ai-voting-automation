import { Request, Response } from 'express'
import { Officer, OfficeDocument } from '../models/Officer'
import { generateToken } from '../utils/tokenUtils'

export const loginOfficer = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body

  // ✅ Explicitly tell TypeScript what this is
  const officer = await Officer.findOne({ email }) as OfficeDocument | null

  if (!officer || officer.password !== password) {
    res.status(401).json({ message: 'Invalid credentials' })
    return
  }

  // ✅ Now _id is known to exist
  const token = generateToken(officer._id.toString())

  res.status(200).json({
    token,
    officer: {
      id: officer._id,
      email: officer.email,
    },
  })
}
