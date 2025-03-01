import express, { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { User } from './models/User';
import userRoutes from './routes/userRoutes';
import stripeRoutes from './routes/stripeRoutes';
import topicsRouter from './routes/topics';
import materialRouter from './routes/materialRoutes';
import { authMiddleware } from './middleware/auth';
import { deleteMaterial } from './controllers/userController';

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

// 在 server 端添加環境變量檢查
console.log('Environment Check:', {
  CLIENT_URL: process.env.CLIENT_URL,
  NODE_ENV: process.env.NODE_ENV,
  ALLOWED_ORIGINS: [
    process.env.CLIENT_URL,
    'http://localhost:3000',
    'https://studylist-coral.vercel.app',
    'https://studylist-2cxo487un-wuchihweis-projects.vercel.app',
    'https://studylist-c86ulswwg-wuchihweis-projects.vercel.app',
    'https://studylistserver-production.up.railway.app'
  ]
});

const app = express();
// Render 會自動設置 PORT 環境變量
const PORT = process.env.PORT || 3001;

console.log('=== Server Configuration ===');
console.log('PORT:', PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('MongoDB URI exists:', !!process.env.MONGODB_URI);
console.log('Registering routes:');
console.log('- /api/users/:firebaseUID/topics');
console.log('- /api/users/:userId/materials');

// Middleware
app.use(cors());
app.use(express.json());

// 添加請求日誌中間件
app.use((req, res, next) => {
  console.log('\n=== Incoming Request ===');
  console.log('Method:', req.method);
  console.log('URL:', req.originalUrl);
  console.log('Params:', req.params);
  console.log('Query:', req.query);
  console.log('Body:', req.body);
  console.log('======================\n');
  next();
});

// CORS configuration
const corsOptions = {
  origin: function (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) {
    const allowedOrigins = [
      process.env.CLIENT_URL,
      'http://localhost:3000',
      'https://studylist-coral.vercel.app',
      'https://studylist-du1fecbz3-wuchihweis-projects.vercel.app',
      'https://studylist-wuchihweis-projects.vercel.app'
    ].filter(Boolean);
    
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'Accept', 
    'Origin'
  ],
  exposedHeaders: ['Authorization'],
  maxAge: 86400
};

// Add Private Network Access header
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
  next();
});

// CORS logging middleware
app.use((req, res, next) => {
  console.log('\n=== CORS Request ===');
  console.log('Method:', req.method);
  console.log('Origin:', req.headers.origin);
  console.log('Access-Control-Request-Headers:', req.headers['access-control-request-headers']);
  next();
});

// CORS configuration
app.use(cors(corsOptions));

// CORS verification middleware
app.use((req, res, next) => {
  console.log('\n=== CORS Post-flight Check ===');
  console.log('Response Headers:', res.getHeaders());
  next();
});

// 請求日誌中間件
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Params:', JSON.stringify(req.params, null, 2));
  console.log('Query:', JSON.stringify(req.query, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));
  next();
});

// 在掛載路由之前添加
app.use((req, res, next) => {
  console.log('Incoming request:', {
    method: req.method,
    path: req.path,
    params: req.params,
    query: req.query,
    body: req.body
  });
  next();
});

// Public routes
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
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
    user: req.user
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

// Mount routes
app.use('/api', userRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/users/:userId/topics', topicsRouter);
app.use('/api/users/:userId/materials', materialRouter);

// Direct route for deleting materials (backup solution)
app.delete('/api/users/:userId/topics/:topicId/categories/:categoryType/materials/:materialId', 
  authMiddleware,
  (req, res, next) => {
    console.log('Direct route hit for delete material:', {
      userId: req.params.userId,
      topicId: req.params.topicId,
      categoryType: req.params.categoryType,
      materialId: req.params.materialId
    });
    next();
  }, 
  deleteMaterial
);

// Debug: Print all registered routes
console.log('=== Registered Routes ===');
app._router.stack.forEach((middleware: any) => {
  if (middleware.route) {
    // Routes registered directly on the app
    console.log(`${Object.keys(middleware.route.methods).join(',')} ${middleware.route.path}`);
  } else if (middleware.name === 'router') {
    // Router middleware
    middleware.handle.stack.forEach((handler: any) => {
      if (handler.route) {
        const path = handler.route.path;
        const methods = Object.keys(handler.route.methods).join(',');
        console.log(`${methods} ${middleware.regexp} -> ${path}`);
      }
    });
  }
});
console.log('========================');

// Error handling middleware
const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
};

app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  console.log('Route not found:', req.method, req.originalUrl);
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Export for testing
export default app;
