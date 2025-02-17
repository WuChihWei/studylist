import express, { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { User } from './models/User';
import userRoutes from './routes/userRoutes';
import stripeRoutes from './routes/stripeRoutes';
import topicsRouter from './routes/topics';
import materialRoutes from './routes/materialRoutes';
import { authMiddleware } from './middleware/auth';

// 在任何其他代碼之前加載環境變數
dotenv.config();

// 添加調試信息
console.log('Environment variables loaded:', {
  FIREBASE_BASE64: process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 ? 'exists' : 'not found',
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT
});

console.log('Starting server with MongoDB URI:', 
  process.env.MONGODB_URI ? 'URI exists' : 'URI missing'
);

const app = express();
// Render 會自動設置 PORT 環境變量
const PORT = process.env.PORT || 3001;

console.log('=== Server Configuration ===');
console.log('PORT:', PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('MongoDB URI exists:', !!process.env.MONGODB_URI);

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
const corsOptions = {
  origin: [
    process.env.CLIENT_URL || 'http://localhost:3000',
    'https://studylist-client.vercel.app',
    'https://studylistserver-production.up.railway.app',
    /\.vercel\.app$/,
    /\.railway\.app$/
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
  maxAge: 86400 // 24 hours
};

// Debug logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log('\n=== INCOMING REQUEST ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Method:', req.method);
  console.log('Path:', req.path);
  console.log('Headers:', req.headers);
  next();
});

// Public routes
app.get('/health', (req: Request, res: Response) => {
  const dbState = mongoose.connection.readyState;
  const dbStateMap: { [key: number]: string } = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  res.json({
    status: 'ok',
    server: 'running',
    mongodb: dbStateMap[dbState] || 'unknown',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// 添加測試路由（放在所有路由之前）
app.get('/test/auth', authMiddleware, (req: Request, res: Response) => {
  console.log('=== Test Auth Route ===');
  console.log('Request headers:', req.headers);
  console.log('User:', req.user);
  res.json({
    success: true,
    message: 'Authentication successful',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

app.get('/test/cors', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'CORS test successful',
    headers: req.headers,
    origin: req.headers.origin || 'no origin'
  });
});

// Protected routes
app.use('/api/users', authMiddleware);

// API routes
app.use('/api/users', userRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/users/:userId/topics', topicsRouter);
app.use('/api/users/:userId/materials', materialRoutes);

// Error handling middleware
const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
};

app.use(errorHandler);

// 404 handler (must be last)
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// Export for testing
export default app;
