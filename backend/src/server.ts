// backend/src/index.ts
import express, { Express } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io'; // Renamed to avoid conflict if 'Server' is used elsewhere
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path'; // For robust path handling

import connectDB from './config/db';

// Route imports
import authRoutes from './routes/authRoutes';
import adminRoutes from './routes/adminRoutes';
import voterRoutes from './routes/voterRoutes';
import officerRoutes from './routes/officerRoutes';
import feedbackRoutes from './routes/feedbackRoutes';
import queueRoutes from './routes/queueRoutes';
import testRoutes from './routes/testRoutes';
import verificationRoutes from './routes/verificationRoutes';
import candidateRoutes from './routes/candidateRoutes';
import voteRoutes from './routes/voteRoutes';

// Middleware imports
import errorHandler from './middleware/errorHandler'; // Assuming you have this file

// Load environment variables
// This attempts to load .env from the root of your 'backend' directory.
// Adjust if your .env file is located elsewhere (e.g., project root).
const envPath = process.env.NODE_ENV === 'production' 
    ? path.resolve(process.cwd(), '.env') // For production, .env might be at project root after build
    : path.resolve(process.cwd(), 'backend', '.env'); // For development, assuming .env is in backend folder
dotenv.config({ path: envPath });
// Fallback if the above doesn't work in all scenarios, try loading from current dir (where script is run)
if (!process.env.MONGO_URI) { // Check if a key var is loaded
    dotenv.config();
}


// Connect to Database
connectDB();

const app: Express = express();
const server = http.createServer(app);

// Middlewares
app.use(cors({
    origin: process.env.FRONTEND_URL || '*', // Be more specific in production (e.g., 'http://localhost:3000')
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded

// Socket.io setup
export const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*', // Match with app.use(cors()) or be more specific
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  },
});

io.on('connection', (socket) => {
  console.log('🔌 Socket connected:', socket.id);
  // Example: Joining a room or handling custom events
  // socket.on('joinRoom', (room) => {
  //   socket.join(room);
  //   console.log(`Socket ${socket.id} joined room ${room}`);
  // });

  socket.on('disconnect', () => {
    console.log('❌ Socket disconnected:', socket.id);
  });
});

// API Routes
const API_BASE = '/api'; // Consistent base path

app.use(`${API_BASE}/auth`, authRoutes);
app.use(`${API_BASE}/admin`, adminRoutes);
app.use(`${API_BASE}/voters`, voterRoutes);
app.use(`${API_BASE}/officer`, officerRoutes);
app.use(`${API_BASE}/feedback`, feedbackRoutes);
app.use(`${API_BASE}/queue`, queueRoutes);
app.use(`${API_BASE}/test`, testRoutes);
app.use(`${API_BASE}/verification`, verificationRoutes);
app.use(`${API_BASE}/candidates`, candidateRoutes);
app.use(`${API_BASE}/vote`, voteRoutes); // Corrected: Added leading slash

// Error Handling Middleware (should be the LAST middleware used)
app.use(errorHandler);

// Server start
const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(
    `🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on http://localhost:${PORT}`
  )
);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error, promise) => {
  console.error(`Unhandled Rejection at: ${promise}, reason: ${err.message}`);
  console.error(err.stack);
  server.close(() => process.exit(1)); // Gracefully shutdown
});
