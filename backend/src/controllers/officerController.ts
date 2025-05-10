import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { Officer, OfficerDocument } from '../models/Officer'
import { generateToken } from '../utils/tokenUtils'

export const loginOfficer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' })
      return
    }

    const officer = await Officer.findOne({ email })

    if (!officer) {
      res.status(401).json({ message: 'Invalid credentials' })
      return
    }

    // ✅ Secure password check using bcrypt
    const isMatch = await bcrypt.compare(password, officer.password)
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid credentials' })
      return
    }

    const token = generateToken(officer._id.toString())

    res.status(200).json({
      token,
      officer: {
        id: officer._id,
        name: officer.name,
        email: officer.email,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
