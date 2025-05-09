import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import dotenv from 'dotenv'
import connectDB from './config/db'

// Route imports
import authRoutes from './routes/authRoutes'
import adminRoutes from './routes/adminRoutes'
import voterRoutes from './routes/voterRoutes'
import officerRoutes from './routes/officerRoutes'
import feedbackRoutes from './routes/feedbackRoutes'
import queueRoutes from './routes/queueRoutes'


// Load environment variables
dotenv.config()

// DB connection
connectDB()

// App setup
const app = express()
const server = http.createServer(app)

// Middlewares
app.use(cors())
app.use(express.json())

// Socket.io setup
export const io = new Server(server, {
  cors: {
    origin: '*', // Set this to your frontend URL in production
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  },
})

io.on('connection', (socket) => {
  console.log('🔌 Socket connected:', socket.id)

  socket.on('disconnect', () => {
    console.log('❌ Socket disconnected:', socket.id)
  })
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/voters', voterRoutes)
app.use('/api/officer', officerRoutes)
app.use('/api/feedback', feedbackRoutes)
app.use('/api/queue', queueRoutes)

// Server start
const PORT = process.env.PORT || 5000
server.listen(PORT, () =>
  console.log(`🚀 Server running at http://localhost:${PORT}`)
)
