import { Request, Response } from 'express'
import { Feedback } from '../models/Feedback'

// @desc   Submit feedback
// @route  POST /api/feedback
// @access Public
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

// @desc   Get all feedback entries
// @route  GET /api/feedback
// @access Admin
export const getAllFeedback = async (req: Request, res: Response): Promise<void> => {
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 })
    res.status(200).json(feedbacks)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to fetch feedback' })
  }
}
