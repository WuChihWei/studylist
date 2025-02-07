import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import userRoutes from './routes/userRoutes';
import stripeRoutes from './routes/stripeRoutes';
import topicsRouter from './routes/topics';
import { Request, Response, NextFunction } from 'express';

// 在任何其他代碼之前加載環境變數
dotenv.config();

// 添加調試信息
console.log('Environment variables loaded:', {
  FIREBASE_BASE64: process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 ? 'exists' : 'not found',
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT
});

console.log('MongoDB URI:', process.env.MONGODB_URI);

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, {
    body: req.body,
    params: req.params,
    headers: req.headers
  });
  next();
});

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  throw new Error('MONGODB_URI is not defined in the environment variables');
}

// MongoDB connection
mongoose.connect(mongoUri)
  .then(() => {
    console.log('Connected to MongoDB');
    console.log('MongoDB connection state:', mongoose.connection.readyState);
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    console.error('Connection details:', {
      uri: mongoUri.replace(/mongodb\+srv:\/\/([^:]+):([^@]+)@/, 'mongodb+srv://***:***@'),
      readyState: mongoose.connection.readyState
    });
  });

// Routes
app.use('/api/users', userRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/users/:firebaseUID/topics', topicsRouter);

// Add before other routes
app.get('/test', (req, res) => {
  res.json({ message: 'Server is running' });
});

app.get('/health', (req, res) => {
  res.json({
    server: 'running',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// 添加全局錯誤處理中間件
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    error: 'Server error',
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});