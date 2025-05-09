import { Request, Response } from 'express'
import { QueueToken } from '../models/QueueToken'
import { io } from '../server' // ✅ import Socket.IO instance

// ➕ Add a new token (auto-incremented)
export const addToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { voterName } = req.body

    if (!voterName) {
      res.status(400).json({ message: 'Voter name is required' })
      return
    }

    const lastToken = await QueueToken.findOne().sort({ tokenNumber: -1 })
    const nextTokenNumber = lastToken ? lastToken.tokenNumber + 1 : 1

    const token = new QueueToken({ tokenNumber: nextTokenNumber, voterName })
    await token.save()

    io.emit('queue:update') // 🔥 Emit real-time update

    res.status(201).json({ message: 'Token added', token })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error adding token' })
  }
}

// 📋 Get tokens (optional filter: ?status=waiting or completed)
export const getTokens = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.query

    const query: any = {}
    if (status === 'waiting' || status === 'completed') {
      query.status = status
    }

    const tokens = await QueueToken.find(query).sort({ tokenNumber: 1 })

    res.status(200).json(tokens)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error fetching tokens' })
  }
}

// ✅ Mark a token as completed
export const completeToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const token = await QueueToken.findByIdAndUpdate(
      id,
      { status: 'completed' },
      { new: true }
    )

    if (!token) {
      res.status(404).json({ message: 'Token not found' })
      return
    }

    io.emit('queue:update') // 🔥 Emit real-time update

    res.status(200).json({ message: 'Token marked as completed', token })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error updating token status' })
  }
}

// ❌ Clear all tokens (use with care)
export const clearQueue = async (req: Request, res: Response): Promise<void> => {
  try {
    await QueueToken.deleteMany({})
    io.emit('queue:update') // 🔥 Emit real-time update

    res.status(200).json({ message: 'Queue cleared' })
  } catch (error) {
    console.error('Error clearing queue:', error)
    res.status(500).json({ message: 'Failed to clear queue' })
  }
}
