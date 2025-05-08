import express, { Request, Response } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import connectDB from './config/db'

// Load env vars
dotenv.config()

// Connect to MongoDB
connectDB()

// App init
const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())

// Basic route
app.get('/', (_req: Request, res: Response) => {
  res.send('✅ API is running...')
})


// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`)
})
