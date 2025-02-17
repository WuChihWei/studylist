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
const PORT = process.env.PORT || 10000;  // 改為更大的默認端口

console.log('=== Server Configuration ===');
console.log('PORT:', PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('MongoDB URI exists:', !!process.env.MONGODB_URI);

// Middleware
app.options('*', cors());

app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://studylist-c86ulswwg-wuchihweis-projects.vercel.app',
    /\.vercel\.app$/,
    /\.railway\.app$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));
app.use(express.json());

app.use((req, res, next) => {
  console.log('\n=== Incoming Request ===');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Method: ${req.method}`);
  console.log(`URL: ${req.url}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Query:', req.query);
  console.log('Body:', req.body);
  console.log('======================\n');
  next();
});

// 在所有路由之前添加
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

  // 處理 OPTIONS 請求
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// 數據庫狀態映射
const dbStateMap = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting'
};

// 根路由 - 不需要認證
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// 健康檢查端點
app.get('/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  
  res.json({
    server: 'running',
    mongodb: dbStateMap[dbState as keyof typeof dbStateMap] || 'unknown',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// API routes - order matters!
app.use('/api/users/:firebaseUID/topics/:topicId/materials', materialRoutes);
app.use('/api/users/:firebaseUID/topics', topicsRouter);
app.use('/api/users', userRoutes);
app.use('/api/stripe', stripeRoutes);

// 404 處理
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// 錯誤處理中間件
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 啟動服務器
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined');
    }
    
    console.log('Attempting to connect to MongoDB...');
    
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000, // 增加超時時間
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      maxPoolSize: 10,
      minPoolSize: 5,
      retryWrites: true,
      w: 'majority'
    });
    
    console.log('MongoDB Connected Successfully');
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return false;
  }
};

const startServer = async () => {
  try {
    console.log('\n=== Server Startup ===');
    console.log('Environment Variables:');
    console.log('- PORT:', PORT);
    console.log('- NODE_ENV:', process.env.NODE_ENV);
    console.log('- CLIENT_URL:', process.env.CLIENT_URL);
    console.log('- MONGODB_URI exists:', !!process.env.MONGODB_URI);
    
    if (await connectDB()) {
      const server = app.listen(PORT, () => {
        console.log('\n=== Server Started ===');
        console.log(`🚀 Server URL: http://localhost:${PORT}`);
        console.log(`📝 API Docs: http://localhost:${PORT}/api-docs`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`👥 CORS Origin: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
        console.log('====================\n');
      }).on('error', (error: any) => {
        if (error.code === 'EADDRINUSE') {
          console.error(`❌ Port ${PORT} is already in use`);
          process.exit(1);
        } else {
          console.error('❌ Server startup error:', error);
        }
      });
    } else {
      console.warn('⚠️  Warning: Running without database connection');
    }
  } catch (error) {
    console.error('❌ Server startup error:', error);
    process.exit(1);
  }
};

startServer();