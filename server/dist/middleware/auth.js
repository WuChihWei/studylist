"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const dotenv_1 = __importDefault(require("dotenv"));
// Try to load environment variables from .env file if they're not already set
if (!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    try {
        const envPath = path_1.default.resolve(process.cwd(), '.env');
        if (fs_1.default.existsSync(envPath)) {
            console.log('Loading environment variables from:', envPath);
            dotenv_1.default.config({ path: envPath });
        }
        else {
            console.error('No .env file found at:', envPath);
        }
    }
    catch (error) {
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
const serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString());
if (!firebase_admin_1.default.apps.length) {
    firebase_admin_1.default.initializeApp({
        credential: firebase_admin_1.default.credential.cert(serviceAccount)
    });
}
console.log('Environment variables:', {
    FIREBASE_SERVICE_ACCOUNT_BASE64: process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 ? 'exists' : 'not found'
});
console.log('Firebase admin initialization status:', firebase_admin_1.default.apps.length ? 'Initialized' : 'Not initialized');
const authMiddleware = async (req, res, next) => {
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
        if (!(authHeader === null || authHeader === void 0 ? void 0 : authHeader.startsWith('Bearer '))) {
            console.log('Authentication failed: No valid authorization header');
            return res.status(401).json({
                error: 'Authentication required',
                details: 'No valid authorization token provided',
                receivedHeaders: req.headers
            });
        }
        const token = authHeader.split('Bearer ')[1];
        console.log('Token received, verifying...');
        const decodedToken = await firebase_admin_1.default.auth().verifyIdToken(token);
        console.log('Token verified successfully for user:', decodedToken.uid);
        req.user = decodedToken;
        next();
    }
    catch (error) {
        console.error('Authentication error:', error);
        return res.status(401).json({
            error: 'Authentication failed',
            details: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        });
    }
};
exports.authMiddleware = authMiddleware;
