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

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://studylist-client.vercel.app',
    'https://studylist-client-git-main-yichenlai.vercel.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204,
  maxAge: 86400
};

// Apply CORS before any other middleware
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// 在路由之前添加基本中間件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 添加請求日誌中間件
app.use((req, res, next) => {
  console.log('\n=== Incoming Request ===');
  console.log('Method:', req.method);
  console.log('Path:', req.path);
  console.log('Headers:', req.headers);
  next();
});

// 保護需要認證的路由
app.use('/api/users', authMiddleware);
// 其他路由配置...
