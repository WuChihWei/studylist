import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';

if (!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
  console.error('Missing environment variable: FIREBASE_SERVICE_ACCOUNT_BASE64');
  console.error('Current environment variables:', Object.keys(process.env));
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
  console.log('\n=== Detailed Auth Middleware Logging ===');
  console.log('Request Details:', {
    path: req.path,
    method: req.method,
    url: req.url,
    baseUrl: req.baseUrl,
    originalUrl: req.originalUrl
  });
  
  console.log('Headers Details:', {
    all: req.headers,
    authorization: req.headers.authorization ? 'Present' : 'Missing',
    origin: req.headers.origin,
    host: req.headers.host,
    'content-type': req.headers['content-type'],
    'accept': req.headers.accept
  });

  if (req.method === 'OPTIONS') {
    console.log('OPTIONS request detected, skipping auth check');
    return next();
  }

  try {
    const authHeader = req.headers.authorization;
    console.log('Authorization header:', authHeader ? `${authHeader.substring(0, 20)}...` : 'Missing');
    
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('Authentication failed: Invalid or missing Bearer token');
      return res.status(401).json({
        error: 'Authentication required',
        details: 'No valid authorization token provided'
      });
    }

    const token = authHeader.split('Bearer ')[1];
    console.log('Token extraction successful, length:', token.length);

    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      console.log('Token verification successful:', {
        uid: decodedToken.uid,
        email: decodedToken.email,
        timestamp: new Date().toISOString()
      });
      
      req.user = decodedToken;
      next();
    } catch (verifyError) {
      console.error('Token verification failed:', verifyError);
      throw verifyError;
    }
  } catch (error) {
    console.error('Authentication error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      timestamp: new Date().toISOString()
    });
    
    return res.status(401).json({
      error: 'Authentication failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
};