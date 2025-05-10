import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { Admin, AdminDocument } from '../models/Admin'
import { Officer, OfficerDocument } from '../models/Officer'
import { Voter } from '../models/Voter'
import { generateToken } from '../utils/tokenUtils'
import { sendOtpToPhone, verifyOtp } from '../utils/otpUtils'


// 🧑‍💼 Admin Login
export const loginAdmin = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body

  try {
    const admin = await Admin.findOne({ email }) as AdminDocument | null

    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      res.status(401).json({ message: 'Invalid credentials' })
      return
    }

    const token = generateToken(admin._id.toString())

    res.status(200).json({
      token,
      user: {
        id: admin._id,
        email: admin.email,
        role: 'admin',
      },
    })
  } catch (err) {
    console.error('Admin login error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

// 👮 Officer Login
export const loginOfficer = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body

  try {
    const officer = await Officer.findOne({ email }) as OfficerDocument | null

    if (!officer || !(await bcrypt.compare(password, officer.password))) {
      res.status(401).json({ message: 'Invalid credentials' })
      return
    }

    const token = generateToken(officer._id.toString())

    res.status(200).json({
      token,
      user: {
        id: officer._id,
        email: officer.email,
        role: 'officer',
      },
    })
  } catch (err) {
    console.error('Officer login error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

// 📲 Send OTP to voter's phone
export const sendOtp = async (req: Request, res: Response) => {
  const { phone } = req.body

  if (!phone) {
    res.status(400).json({ message: 'Phone is required' })
    return
  }

  try {
    await sendOtpToPhone(phone)
    res.status(200).json({ message: 'OTP sent successfully' })
  } catch (err) {
    console.error('OTP send error:', err)
    res.status(500).json({ message: 'Failed to send OTP' })
  }
}

// ✅ Verify OTP and create/fetch voter
export const verifyOtpCode = async (req: Request, res: Response) => {
  const { phone, otp } = req.body

  if (!phone || !otp) {
    res.status(400).json({ message: 'Phone and OTP required' })
    return
  }

  try {
    const valid = await verifyOtp(phone, otp)
    if (!valid) {
      res.status(401).json({ message: 'Invalid OTP' })
      return
    }

    let voter = await Voter.findOne({ phone })
    if (!voter) voter = await Voter.create({ phone })

    const token = generateToken(voter._id.toString())

    res.status(200).json({
      token,
      user: {
        id: voter._id,
        phone: voter.phone,
        role: 'voter',
      },
    })
  } catch (err) {
    console.error('OTP verification error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}
