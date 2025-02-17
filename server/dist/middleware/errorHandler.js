"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const stripe_1 = __importDefault(require("stripe"));
const errorHandler = (err, req, res, next) => {
    console.error('Error:', {
        message: err.message,
        stack: err.stack,
        origin: req.headers.origin
    });
    if (err.name === 'CORSError') {
        return res.status(403).json({
            error: 'CORS Error',
            message: 'Origin not allowed',
            allowedOrigins: process.env.CLIENT_URL
        });
    }
    if (err instanceof stripe_1.default.errors.StripeError) {
        return res.status(err.statusCode || 500).json({
            error: err.type,
            message: err.message
        });
    }
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
};
exports.errorHandler = errorHandler;
