import { Request, Response } from 'express'
import { Voter } from '../models/Voter'

// POST /api/voters/register
export const registerVoter = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fullName, voterId, dob, selfie } = req.body

    const existing = await Voter.findOne({ voterId })
    if (existing) {
      res.status(400).json({ message: 'Voter already exists' })
      return
    }

    const voter = new Voter({ fullName, voterId, dob, selfie })
    await voter.save()

    res.status(201).json({ message: 'Voter registered', voter })
  } catch (error) {
    console.error('Error registering voter:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

// GET /api/voters
export const getAllVoters = async (req: Request, res: Response): Promise<void> => {
  try {
    const voters = await Voter.find().sort({ createdAt: -1 }) // newest first
    res.status(200).json(voters)
  } catch (error) {
    console.error('Error fetching voters:', error)
    res.status(500).json({ message: 'Failed to fetch voters' })
  }
}
