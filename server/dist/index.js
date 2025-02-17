"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const stripeRoutes_1 = __importDefault(require("./routes/stripeRoutes"));
const topics_1 = __importDefault(require("./routes/topics"));
const materialRoutes_1 = __importDefault(require("./routes/materialRoutes"));
// 在任何其他代碼之前加載環境變數
dotenv_1.default.config();
// 添加調試信息
console.log('Environment variables loaded:', {
    FIREBASE_BASE64: process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 ? 'exists' : 'not found',
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT
});
console.log('Starting server with MongoDB URI:', process.env.MONGODB_URI ? 'URI exists' : 'URI missing');
const app = (0, express_1.default)();
// Render 會自動設置 PORT 環境變量
const PORT = process.env.PORT || 10000; // 改為更大的默認端口
console.log('=== Server Configuration ===');
console.log('PORT:', PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('MongoDB URI exists:', !!process.env.MONGODB_URI);
// Middleware
app.use((0, cors_1.default)({
    origin: [
        process.env.CLIENT_URL || 'http://localhost:3000',
        'https://studylist-c86ulswwg-wuchihweis-projects.vercel.app',
        /\.vercel\.app$/,
        /\.railway\.app$/ // Add this line for Railway domains
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express_1.default.json());
app.use((req, res, next) => {
    console.log('\n=== Incoming Request ===');
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`Method: ${req.method}`);
    console.log(`URL: ${req.url}`);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Query:', req.query);
    console.log('Body:', req.body);
    console.log('======================\n');
    next();
});
// 數據庫狀態映射
const dbStateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
};
// 根路由 - 不需要認證
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});
// 健康檢查端點
app.get('/health', (req, res) => {
    const dbState = mongoose_1.default.connection.readyState;
    res.json({
        server: 'running',
        mongodb: dbStateMap[dbState] || 'unknown',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
    });
});
// API routes - order matters!
app.use('/api/users/:firebaseUID/topics/:topicId/materials', materialRoutes_1.default);
app.use('/api/users/:firebaseUID/topics', topics_1.default);
app.use('/api/users', userRoutes_1.default);
app.use('/api/stripe', stripeRoutes_1.default);
// 404 處理
app.use((req, res) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.path,
        method: req.method
    });
});
// 錯誤處理中間件
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});
// 啟動服務器
const connectDB = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined');
        }
        console.log('Attempting to connect to MongoDB...');
        await mongoose_1.default.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 30000, // 增加超時時間
            socketTimeoutMS: 45000,
            connectTimeoutMS: 30000,
            maxPoolSize: 10,
            minPoolSize: 5,
            retryWrites: true,
            w: 'majority'
        });
        console.log('MongoDB Connected Successfully');
        return true;
    }
    catch (error) {
        console.error('MongoDB connection error:', error);
        return false;
    }
};
const startServer = async () => {
    try {
        console.log('\n=== Server Startup ===');
        console.log('Environment Variables:');
        console.log('- PORT:', PORT);
        console.log('- NODE_ENV:', process.env.NODE_ENV);
        console.log('- CLIENT_URL:', process.env.CLIENT_URL);
        console.log('- MONGODB_URI exists:', !!process.env.MONGODB_URI);
        if (await connectDB()) {
            const server = app.listen(PORT, () => {
                console.log('\n=== Server Started ===');
                console.log(`🚀 Server URL: http://localhost:${PORT}`);
                console.log(`📝 API Docs: http://localhost:${PORT}/api-docs`);
                console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
                console.log(`👥 CORS Origin: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
                console.log('====================\n');
            }).on('error', (error) => {
                if (error.code === 'EADDRINUSE') {
                    console.error(`❌ Port ${PORT} is already in use`);
                    process.exit(1);
                }
                else {
                    console.error('❌ Server startup error:', error);
                }
            });
        }
        else {
            console.warn('⚠️  Warning: Running without database connection');
        }
    }
    catch (error) {
        console.error('❌ Server startup error:', error);
        process.exit(1);
    }
};
startServer();
