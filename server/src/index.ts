import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { User } from './models/User';
import userRoutes from './routes/userRoutes';
import stripeRoutes from './routes/stripeRoutes';
import topicsRouter from './routes/topics';
import materialRoutes from './routes/materialRoutes';
import { Request, Response, NextFunction } from 'express';
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

// Debug logging for all requests
app.use((req, res, next) => {
  console.log('\n=== INCOMING REQUEST ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  
  // Log response
  const oldSend = res.send;
  res.send = function (data) {
    console.log('\n=== OUTGOING RESPONSE ===');
    console.log('Status:', res.statusCode);
    console.log('Headers:', JSON.stringify(res.getHeaders(), null, 2));
    console.log('Body:', data);
    console.log('========================\n');
    return oldSend.apply(res, arguments);
  };
  
  next();
});

// CORS configuration
const corsOptions = {
  origin: ['http://localhost:3000', 'https://studylist-client.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true
};

app.use(cors(corsOptions));

// Handle OPTIONS requests explicitly
app.options('*', (req, res) => {
  console.log('\n=== OPTIONS Request Handler ===');
  console.log('Origin:', req.headers.origin);
  
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  
  console.log('Response Headers:', res.getHeaders());
  res.status(204).end();
});

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log('\n=== Request Details ===');
  console.log('Time:', new Date().toISOString());
  console.log('Method:', req.method);
  console.log('Path:', req.path);
  console.log('Origin:', req.headers.origin);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Protected routes
app.use('/api/users', authMiddleware);

// Export for testing
export default app;
