import express, { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { User } from './models/User';
import userRoutes from './routes/userRoutes';
import stripeRoutes from './routes/stripeRoutes';
import topicRoutes from './routes/topicRoutes';
import { authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/appError';
import { 
  addMaterial, 
  completeMaterial, 
  uncompleteMaterial, 
  updateMaterialProgress, 
  deleteMaterial 
} from './controllers/materialController';

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

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
  console.log('Query params:', req.query);
  console.log('Route params:', req.params);
  console.log('Body:', req.body);
  next();
});

// Public routes
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Testing routes to verify API functionality
app.get('/test/routes', (req: Request, res: Response) => {
  const registeredRoutes: any[] = [];
  
  // Get all registered routes
  app._router.stack.forEach((middleware: any) => {
    if (middleware.route) {
      // Routes registered directly on the app
      registeredRoutes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods)
      });
    } else if (middleware.name === 'router') {
      // Routes registered via router middleware
      middleware.handle.stack.forEach((handler: any) => {
        if (handler.route) {
          registeredRoutes.push({
            path: handler.route.path,
            methods: Object.keys(handler.route.methods),
            baseUrl: middleware.regexp?.toString()
          });
        }
      });
    }
  });
  
  res.json({
    message: 'Registered routes',
    routes: registeredRoutes
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

// Simple test route for material deletion
app.delete('/test/delete-material', authMiddleware, (req: Request, res: Response) => {
  console.log('⭐ TEST DELETE route triggered');
  console.log('Query params:', req.query);
  res.json({
    success: true,
    message: 'DELETE test route successful',
    params: req.query
  });
});

// Protected routes - 将此行移到合适的位置
// app.use('/api/users', authMiddleware); - 注释掉这行，避免重复认证

// 路由挂载前添加调试日志
console.log('=== Route Setup ===');
console.log('Registering routes...');

// CRITICAL: 首先注册直接材料删除路由，确保它最先被匹配
app.delete('/api/users/:userId/topics/:topicId/materials/:materialId', authMiddleware, (req, res, next) => {
  console.log('⭐ Direct material delete route triggered');
  console.log('Params:', req.params);
  console.log('Forwarding to materialController.deleteMaterial');
  try {
    deleteMaterial(req, res, next);
  } catch (error) {
    console.error('Error in direct delete route:', error);
    next(error);
  }
});

// API 路由 - 在直接路由之后注册
app.use('/api/users/:userId/topics', authMiddleware, topicRoutes);

// API routes - 最后注册其他API路由
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/stripe', authMiddleware, stripeRoutes);

// 路由注册后添加确认日志
console.log('Routes registered successfully');
console.log('Material delete route registered at: /api/users/:userId/topics/:topicId/materials/:materialId');

// 添加直接路由以便于调试
app.get('/api/routes', (req, res) => {
  console.log('Routes debug endpoint accessed');
  try {
    interface RouteInfo {
      path: string;
      methods: string[];
    }
    
    const routes: RouteInfo[] = [];
    app._router.stack.forEach((middleware: any) => {
      if(middleware.route) { // routes registered directly on the app
        routes.push({
          path: middleware.route.path,
          methods: Object.keys(middleware.route.methods)
        });
      } else if(middleware.name === 'router') { // router middleware
        middleware.handle.stack.forEach((handler: any) => {
          if(handler.route) {
            const path = handler.route.path;
            routes.push({
              path: middleware.regexp.toString() + path,
              methods: Object.keys(handler.route.methods)
            });
          }
        });
      }
    });
    res.json({ routes });
  } catch (error) {
    console.error('Error generating routes list:', error);
    res.status(500).json({ error: 'Failed to generate routes list' });
  }
});

// Error handling middleware
app.use(errorHandler);

// 404 handler (must be last)
app.use((req: Request, res: Response) => {
  console.log(`[404] ❌ Route not found: ${req.method} ${req.url}`);
  res.status(404).json({
    error: 'Route not found',
    path: req.url,
    method: req.method
  });
});

// Export for testing
export default app;
