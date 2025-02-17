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
    var _a;
    console.log('Auth middleware triggered');
    console.log('Authorization header:', req.headers.authorization ? 'Present' : 'Missing');
    try {
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split('Bearer ')[1];
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }
        const decodedToken = await firebase_admin_1.default.auth().verifyIdToken(token);
        req.user = decodedToken;
        next();
    }
    catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};
exports.authMiddleware = authMiddleware;
