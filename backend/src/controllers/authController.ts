import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { Admin, AdminDocument } from '../models/Admin'
import { Officer, OfficeDocument } from '../models/Officer'
import { generateToken } from '../utils/tokenUtils'

// POST /api/admin/login
export const loginAdmin = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body

  const admin = await Admin.findOne({ email }) as AdminDocument | null

  if (!admin || !(await bcrypt.compare(password, admin.password))) {
    res.status(401).json({ message: 'Invalid credentials' })
    return
  }

  const token = generateToken(admin._id.toString())

  res.status(200).json({
    token,
    admin: {
      id: admin._id,
      email: admin.email,
    },
  })
}

// POST /api/officer/login
export const loginOfficer = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body

  const officer = await Officer.findOne({ email }) as OfficeDocument | null

  if (!officer || !(await bcrypt.compare(password, officer.password))) {
    res.status(401).json({ message: 'Invalid credentials' })
    return
  }

  const token = generateToken(officer._id.toString())

  res.status(200).json({
    token,
    officer: {
      id: officer._id,
      email: officer.email,
    },
  })
}
