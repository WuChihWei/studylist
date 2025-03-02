import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Try to load environment variables from .env file if they're not already set
if (!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      console.log('Loading environment variables from:', envPath);
      dotenv.config({ path: envPath });
    } else {
      console.error('No .env file found at:', envPath);
    }
  } catch (error) {
    console.error('Error loading .env file:', error);
  }
}

// Check again after trying to load from .env
if (!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
  console.error('Missing environment variable: FIREBASE_SERVICE_ACCOUNT_BASE64');
  console.error('Current environment variables:', Object.keys(process.env));
  console.error('Please make sure your .env file contains the FIREBASE_SERVICE_ACCOUNT_BASE64 variable');
  console.error('You can run the server with: npm run start:env');
  throw new Error('FIREBASE_SERVICE_ACCOUNT_BASE64 environment variable is not set');
}

// 從環境變數讀取 Firebase 憑證
const serviceAccount = JSON.parse(
  Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString()
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

// 扩展 Express Request 类型
declare global {
  namespace Express {
    interface Request {
      user?: admin.auth.DecodedIdToken;
    }
  }
}

console.log('Environment variables:', {
  FIREBASE_SERVICE_ACCOUNT_BASE64: process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 ? 'exists' : 'not found'
});

console.log('Firebase admin initialization status:', admin.apps.length ? 'Initialized' : 'Not initialized');

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  console.log('\n=== Auth Middleware ===');
  console.log('Request path:', req.path);
  console.log('Request method:', req.method);
  console.log('Request headers:', {
    authorization: req.headers.authorization ? 'Present' : 'Missing',
    origin: req.headers.origin,
    host: req.headers.host,
    'content-type': req.headers['content-type']
  });

  // 處理 OPTIONS 請求
  if (req.method === 'OPTIONS') {
    console.log('OPTIONS request - skipping auth check');
    return next();
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('Authentication failed: No valid authorization header');
      return res.status(401).json({
        error: 'Authentication required',
        details: 'No valid authorization token provided',
        receivedHeaders: req.headers
      });
    }

    const token = authHeader.split('Bearer ')[1];
    console.log('Token received, verifying...');

    const decodedToken = await admin.auth().verifyIdToken(token);
    console.log('Token verified successfully for user:', decodedToken.uid);
    
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      error: 'Authentication failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
};