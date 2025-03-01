"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
if (!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    console.error('Missing environment variable: FIREBASE_SERVICE_ACCOUNT_BASE64');
    console.error('Current environment variables:', Object.keys(process.env));
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
    console.log('\n=== Auth Middleware Extended Logging ===');
    console.log('Full URL:', req.originalUrl);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    try {
        const authHeader = req.headers.authorization;
        if (!(authHeader === null || authHeader === void 0 ? void 0 : authHeader.startsWith('Bearer '))) {
            return res.status(401).json({
                error: 'Invalid token format',
                expected: 'Bearer <token>',
                received: authHeader ? authHeader.substring(0, 20) + '...' : 'none'
            });
        }
        const token = authHeader.split('Bearer ')[1];
        console.log('Token first 20 chars:', token.substring(0, 20) + '...');
        try {
            const decodedToken = await firebase_admin_1.default.auth().verifyIdToken(token);
            console.log('Token verification success:', {
                uid: decodedToken.uid,
                email: decodedToken.email,
                timestamp: new Date().toISOString()
            });
            req.user = decodedToken;
            next();
        }
        catch (verifyError) {
            console.error('Token verification failed:', verifyError);
            return res.status(401).json({
                error: 'Invalid token',
                details: verifyError instanceof Error ? verifyError.message : 'Unknown error'
            });
        }
    }
    catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(401).json({
            error: 'Authentication failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.authMiddleware = authMiddleware;
