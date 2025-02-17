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
  try {
    const authHeader = req.headers.authorization;
    console.log('Auth Header:', authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No token found in request');
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    console.log('Token extracted:', token.substring(0, 10) + '...');

    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      console.log('Token verified successfully:', decodedToken.uid);
      req.user = decodedToken;
      next();
    } catch (verifyError) {
      console.error('Token verification failed:', verifyError);
      return res.status(403).json({ error: 'Invalid token' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};