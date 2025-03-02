"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
const PORT = 8080;
// Basic middleware
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    origin: 'http://localhost:3000',
    credentials: true
}));
// Test endpoint
app.get('/test', (req, res) => {
    console.log('Test endpoint accessed');
    console.log('Request headers:', req.headers);
    res.json({
        message: 'Test successful',
        origin: req.headers.origin || 'No origin',
        timestamp: new Date().toISOString()
    });
});
// Start the server
try {
    const server = app.listen(PORT, () => {
        console.log(`Test server is running on port ${PORT}`);
    });
    server.on('error', (error) => {
        console.error('Server error:', error);
    });
    // Keep the process alive
    process.stdin.resume();
    process.on('SIGINT', () => {
        console.log('Shutting down server gracefully');
        server.close(() => {
            console.log('Server closed');
            process.exit(0);
        });
    });
}
catch (error) {
    console.error('Error starting server:', error);
}
