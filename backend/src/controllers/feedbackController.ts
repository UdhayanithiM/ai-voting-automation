import { Request, Response } from 'express'
import { Feedback } from '../models/Feedback'

export const submitFeedback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { voterId, message } = req.body

    if (!voterId || !message) {
      res.status(400).json({ message: 'Voter ID and message are required' })
      return
    }

    const feedback = new Feedback({ voterId, message })
    await feedback.save()

    res.status(201).json({ message: 'Feedback submitted successfully' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to submit feedback' })
  }
}
