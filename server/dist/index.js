"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const User_1 = require("./models/User");
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
// import stripeRoutes from './routes/stripeRoutes';
const topicRoutes_1 = __importDefault(require("./routes/topicRoutes"));
const materialRoutes_1 = __importDefault(require("./routes/materialRoutes"));
const auth_1 = require("./middleware/auth");
const appError_1 = require("./middleware/appError");
const materialController_1 = require("./controllers/materialController");
// 在任何其他代碼之前加載環境變數
// Explicitly specify the path to the .env file
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../.env') });
// 添加調試信息
console.log('Environment variables loaded:', {
    FIREBASE_BASE64: process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 ? 'exists' : 'not found',
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT
});
console.log('Starting server with MongoDB URI:', process.env.MONGODB_URI ? 'URI exists' : 'URI missing');
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
const app = (0, express_1.default)();
// Render 會自動設置 PORT 環境變量
const PORT = process.env.PORT || 3001;
console.log('=== Server Configuration ===');
console.log('PORT:', PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('MongoDB URI exists:', !!process.env.MONGODB_URI);
// Basic middleware
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// CORS configuration
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            process.env.CLIENT_URL,
            'http://localhost:3000',
            'http://localhost:5173',
            'https://studylist-coral.vercel.app',
            'https://studylist-du1fecbz3-wuchihweis-projects.vercel.app',
            'https://studylist-wuchihweis-projects.vercel.app',
            'https://studylist-c86ulswwg-wuchihweis-projects.vercel.app'
        ].filter(Boolean);
        console.log('CORS Origin Check:', {
            requestOrigin: origin,
            allowedOrigins,
            isAllowed: !origin || allowedOrigins.includes(origin) || (origin && origin.endsWith('.vercel.app'))
        });
        // Always allow localhost:3000 for development
        if (origin === 'http://localhost:3000') {
            callback(null, true);
            return;
        }
        // For development, allow all origins
        if (process.env.NODE_ENV === 'development') {
            callback(null, true);
            return;
        }
        if (!origin || allowedOrigins.includes(origin) || (origin && origin.endsWith('.vercel.app'))) {
            callback(null, true);
        }
        else {
            console.warn(`CORS blocked origin: ${origin}`);
            callback(null, false);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'Accept',
        'Origin',
        'X-Requested-With'
    ],
    exposedHeaders: ['Authorization'],
    maxAge: 86400
};
// Add Private Network Access header
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
    next();
});
// Add CORS headers directly for preflight requests
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
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
// Apply CORS configuration
app.use((0, cors_1.default)(corsOptions));
// CORS verification middleware
app.use((req, res, next) => {
    console.log('\n=== CORS Post-flight Check ===');
    console.log('Response Headers:', res.getHeaders());
    next();
});
// 請求日誌中間件
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Query params:', req.query);
    console.log('Route params:', req.params);
    console.log('Body:', req.body);
    next();
});
// Basic health check endpoint (put at the very beginning)
app.get('/deployment-check', (req, res) => {
    console.log('⚠️ DEPLOYMENT CHECK ENDPOINT ACCESSED ⚠️');
    res.json({
        message: 'Deployment check successful - new code is active',
        timestamp: new Date().toISOString(),
        deploymentId: 'March-1-2025-fix'
    });
});
// Add a CORS test endpoint
app.get('/cors-test', (req, res) => {
    console.log('CORS Test endpoint accessed');
    console.log('Request headers:', JSON.stringify(req.headers, null, 2));
    try {
        // Set CORS headers manually for this endpoint
        res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
        res.header('Access-Control-Allow-Credentials', 'true');
        console.log('Response headers set:', JSON.stringify(res.getHeaders(), null, 2));
        // Send response
        res.status(200).json({
            message: 'CORS test successful',
            origin: req.headers.origin || 'No origin',
            host: req.headers.host || 'No host',
            timestamp: new Date().toISOString(),
            server: 'Main Express Server on port 4001'
        });
        console.log('Response sent successfully');
    }
    catch (error) {
        console.error('Error in CORS test endpoint:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});
// Public routes
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString()
    });
});
// Testing routes to verify API functionality
app.get('/test/routes', (req, res) => {
    const registeredRoutes = [];
    // Get all registered routes
    app._router.stack.forEach((middleware) => {
        if (middleware.route) {
            // Routes registered directly on the app
            registeredRoutes.push({
                path: middleware.route.path,
                methods: Object.keys(middleware.route.methods)
            });
        }
        else if (middleware.name === 'router') {
            // Routes registered via router middleware
            middleware.handle.stack.forEach((handler) => {
                var _a;
                if (handler.route) {
                    registeredRoutes.push({
                        path: handler.route.path,
                        methods: Object.keys(handler.route.methods),
                        baseUrl: (_a = middleware.regexp) === null || _a === void 0 ? void 0 : _a.toString()
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
app.get('/test/auth', auth_1.authMiddleware, (req, res) => {
    console.log('=== Test Auth Route ===');
    console.log('Request headers:', req.headers);
    console.log('User:', req.user);
    res.json({
        success: true,
        message: 'Authentication successful',
        user: req.user
    });
});
app.get('/test/cors', (req, res) => {
    res.json({
        success: true,
        message: 'CORS test successful',
        headers: req.headers,
        origin: req.headers.origin || 'no origin'
    });
});
// Simple test route for material deletion
app.delete('/test/delete-material', auth_1.authMiddleware, (req, res) => {
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
// 关键：注册专门的路由测试端点
app.get('/api/test-routes', (req, res) => {
    console.log('Routes test endpoint accessed');
    try {
        const routes = [];
        // Helper to get route path
        const getRoutePath = (layer) => {
            if (!layer.route)
                return '';
            return layer.route.path;
        };
        // Routes registered directly on app
        app._router.stack.forEach((middleware) => {
            if (middleware.route) {
                routes.push({
                    path: middleware.route.path,
                    methods: Object.keys(middleware.route.methods)
                });
            }
            else if (middleware.name === 'router') {
                // Get the base path
                const basePath = middleware.regexp.toString()
                    .replace('\\/?(?=\\/|$)/i', '')
                    .replace(/^\/\^/, '')
                    .replace(/\/\?$/, '')
                    .replace(/\\\//g, '/');
                // Routes on sub-routers
                middleware.handle.stack.forEach((handler) => {
                    if (handler.route) {
                        const routePath = getRoutePath(handler);
                        routes.push({
                            path: basePath + routePath,
                            methods: Object.keys(handler.route.methods)
                        });
                    }
                });
            }
        });
        res.json({
            routes,
            routesCount: routes.length,
            message: '路由测试端点 - 这是查看所有已注册路由的地方'
        });
    }
    catch (error) {
        console.error('Error generating routes list:', error);
        res.status(500).json({ error: 'Failed to generate routes list' });
    }
});
// 删除所有现有的复杂DELETE路由处理代码
// 添加一个简单直接的删除端点
app.delete('/api/materials/:materialId', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const { materialId } = req.params;
        const { userId, topicId } = req.query;
        console.log('🔴 DELETE MATERIAL - Simple Route');
        console.log('MaterialID:', materialId);
        console.log('UserID:', userId);
        console.log('TopicID:', topicId);
        // 调用控制器函数
        req.params.userId = userId;
        req.params.topicId = topicId;
        await (0, materialController_1.deleteMaterial)(req, res, next);
    }
    catch (error) {
        next(error);
    }
});
// API 路由 - 在直接路由之后注册
app.use('/api/users/:userId/topics', auth_1.authMiddleware, topicRoutes_1.default);
// Mount the materials route for simplified deletion
app.use('/api/materials', auth_1.authMiddleware, materialRoutes_1.default);
// API routes - 最后注册其他API路由
app.use('/api/users', auth_1.authMiddleware, userRoutes_1.default);
// app.use('/api/stripe', stripeRoutes);
// 路由注册后添加确认日志
console.log('Routes registered successfully');
console.log('Material delete routes registered at:');
console.log('1. /api/users/:userId/topics/:topicId/materials/:materialType/:materialId');
console.log('2. /api/users/:userId/topics/:topicId/materials/:materialId');
// 添加直接路由以便于调试
app.get('/api/routes', (req, res) => {
    console.log('Routes debug endpoint accessed');
    try {
        const routes = [];
        app._router.stack.forEach((middleware) => {
            if (middleware.route) { // routes registered directly on the app
                routes.push({
                    path: middleware.route.path,
                    methods: Object.keys(middleware.route.methods)
                });
            }
            else if (middleware.name === 'router') { // router middleware
                middleware.handle.stack.forEach((handler) => {
                    if (handler.route) {
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
    }
    catch (error) {
        console.error('Error generating routes list:', error);
        res.status(500).json({ error: 'Failed to generate routes list' });
    }
});
// 添加一个简化的删除端点用于测试
app.delete('/api/simple-delete-material', auth_1.authMiddleware, async (req, res) => {
    try {
        const { userId, topicId, materialId } = req.query;
        console.log('🔴 SIMPLE DELETE TEST');
        console.log('UserID:', userId);
        console.log('TopicID:', topicId);
        console.log('MaterialID:', materialId);
        const user = await User_1.User.findOne({ firebaseUID: userId });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const topic = user.topics.find(t => { var _a; return ((_a = t._id) === null || _a === void 0 ? void 0 : _a.toString()) === topicId; });
        if (!topic || !topic.categories) {
            return res.status(404).json({ error: 'Topic not found' });
        }
        let materialDeleted = false;
        for (const type of ['webpage', 'video', 'podcast', 'book']) {
            const materials = topic.categories[type];
            if (!Array.isArray(materials))
                continue;
            const materialIndex = materials.findIndex(m => { var _a; return ((_a = m._id) === null || _a === void 0 ? void 0 : _a.toString()) === materialId; });
            if (materialIndex !== -1) {
                materials.splice(materialIndex, 1);
                materialDeleted = true;
                break;
            }
        }
        if (!materialDeleted) {
            return res.status(404).json({ error: 'Material not found' });
        }
        await user.save();
        return res.json(user);
    }
    catch (error) {
        console.error('Error in simple delete:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
app.get('/api/test-mongo-delete', async (req, res) => {
    try {
        const { userId, topicId, materialId } = req.query;
        // 直接使用MongoDB操作
        const result = await User_1.User.updateOne({ firebaseUID: userId, "topics._id": topicId }, { $pull: { "topics.$.categories.webpage": { _id: materialId } } });
        console.log('MongoDB result:', result);
        res.json(result);
    }
    catch (error) {
        console.error('MongoDB test error:', error);
        res.status(500).json({ error: String(error) });
    }
});
// Add a simple API test endpoint that doesn't require authentication
app.get('/api/test', (req, res) => {
    console.log('API Test endpoint accessed');
    console.log('Request headers:', JSON.stringify(req.headers, null, 2));
    res.json({
        message: 'API test successful',
        origin: req.headers.origin || 'No origin',
        timestamp: new Date().toISOString(),
        server: 'Main Express Server on port 4001'
    });
});
// Error handling middleware
app.use(appError_1.errorHandler);
// 404 handler (must be last)
app.use((req, res) => {
    console.log(`[404] ❌ Route not found: ${req.method} ${req.url}`);
    res.status(404).json({
        error: 'Route not found',
        path: req.url,
        method: req.method
    });
});
// Export for testing
exports.default = app;
// Connect to MongoDB and start the server
if (process.env.MONGODB_URI) {
    mongoose_1.default.connect(process.env.MONGODB_URI)
        .then(() => {
        console.log('Connected to MongoDB');
        // Explicitly use port 4001 for local development
        const serverPort = 4001;
        try {
            const server = app.listen(serverPort, () => {
                console.log(`Server is running on port ${serverPort}`);
                console.log(`Access the server at http://localhost:${serverPort}/`);
                console.log('CORS is configured to allow requests from http://localhost:3000');
            });
            server.on('error', (error) => {
                console.error('Server error:', error);
                if (error.code === 'EADDRINUSE') {
                    console.error(`Port ${serverPort} is already in use. Try another port.`);
                }
            });
            // Keep the process alive
            process.stdin.resume();
            // Handle graceful shutdown
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
    })
        .catch(err => {
        console.error('MongoDB connection error:', err);
    });
}
else {
    console.error('MONGODB_URI is not defined');
}
