import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import connectDB from './config/db'

import authRoutes from './routes/authRoutes'
import adminRoutes from './routes/adminRoutes'
import voterRoutes from './routes/voterRoutes'
import officerRoutes from './routes/officerRoutes'
import feedbackRoutes from './routes/feedbackRoutes'
dotenv.config()
connectDB()

const app = express()
app.use(cors())
app.use(express.json())

// Routes
app.use('/api', authRoutes)         // /api/admin/login
app.use('/api/admin', adminRoutes)  // /api/admin/voters
app.use('/api/voters', voterRoutes) // /api/voters (POST)
app.use('/api/officer', officerRoutes)
app.use('/api/feedback', feedbackRoutes) // /api/officer/voters (GET)

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`))
