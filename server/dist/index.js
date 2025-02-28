"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const User_1 = require("./models/User");
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const stripeRoutes_1 = __importDefault(require("./routes/stripeRoutes"));
const topics_1 = __importDefault(require("./routes/topics"));
const materialRoutes_1 = __importDefault(require("./routes/materialRoutes"));
const auth_1 = require("./middleware/auth");
const userController_1 = require("./controllers/userController");
// 在任何其他代碼之前加載環境變數
dotenv_1.default.config();
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
console.log('Registering routes:');
console.log('- /api/users/:firebaseUID/topics');
console.log('- /api/users/:userId/materials');
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// 添加請求日誌中間件
app.use((req, res, next) => {
    console.log('\n=== Incoming Request ===');
    console.log('Method:', req.method);
    console.log('URL:', req.originalUrl);
    console.log('Params:', req.params);
    console.log('Query:', req.query);
    console.log('Body:', req.body);
    console.log('======================\n');
    next();
});
// CORS configuration
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            process.env.CLIENT_URL,
            'http://localhost:3000',
            'https://studylist-coral.vercel.app',
            'https://studylist-du1fecbz3-wuchihweis-projects.vercel.app',
            'https://studylist-wuchihweis-projects.vercel.app'
        ].filter(Boolean);
        if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'Accept',
        'Origin'
    ],
    exposedHeaders: ['Authorization'],
    maxAge: 86400
};
// Add Private Network Access header
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
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
// CORS configuration
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
    console.log('Params:', JSON.stringify(req.params, null, 2));
    console.log('Query:', JSON.stringify(req.query, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));
    next();
});
// 在掛載路由之前添加
app.use((req, res, next) => {
    console.log('Incoming request:', {
        method: req.method,
        path: req.path,
        params: req.params,
        query: req.query,
        body: req.body
    });
    next();
});
// Public routes
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString()
    });
});
// Simple test route for debugging
app.get('/test/route/:param1/:param2', (req, res) => {
    console.log('\n=== TEST ROUTE HIT ===');
    console.log('Params:', req.params);
    console.log('Query:', req.query);
    console.log('Path:', req.path);
    console.log('Original URL:', req.originalUrl);
    console.log('======================\n');
    res.json({
        success: true,
        message: 'Test route working',
        params: req.params,
        query: req.query,
        path: req.path,
        originalUrl: req.originalUrl
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
// Protected routes
app.use('/api/users', auth_1.authMiddleware);
// Mount routes
app.use('/api', userRoutes_1.default);
app.use('/api/stripe', stripeRoutes_1.default);
app.use('/api/users/:userId/topics', topics_1.default);
app.use('/api/users/:userId/materials', materialRoutes_1.default);
// Direct route for deleting materials (backup solution)
app.delete('/api/users/:userId/topics/:topicId/categories/:categoryType/materials/:materialId', auth_1.authMiddleware, (req, res, next) => {
    console.log('\n=== DIRECT DELETE ROUTE HIT ===');
    console.log('Request params:', {
        userId: req.params.userId,
        topicId: req.params.topicId,
        categoryType: req.params.categoryType,
        materialId: req.params.materialId
    });
    console.log('Request path:', req.path);
    console.log('Original URL:', req.originalUrl);
    console.log('======================\n');
    next();
}, userController_1.deleteMaterial);
// Test GET route to verify material access
app.get('/api/users/:userId/topics/:topicId/categories/:categoryType/materials/:materialId', auth_1.authMiddleware, async (req, res) => {
    var _a;
    try {
        console.log('\n=== TEST GET MATERIAL ROUTE ===');
        const { userId, topicId, categoryType, materialId } = req.params;
        const firebaseUID = (_a = req.user) === null || _a === void 0 ? void 0 : _a.uid;
        console.log('Test route params:', { userId, topicId, categoryType, materialId });
        console.log('Firebase UID from auth:', firebaseUID);
        if (!firebaseUID || firebaseUID !== userId) {
            console.log('Auth error: Firebase UID mismatch or missing');
            return res.status(403).json({ error: 'Unauthorized access' });
        }
        const user = await User_1.User.findOne({ firebaseUID });
        if (!user) {
            console.log('User not found with firebaseUID:', firebaseUID);
            return res.status(404).json({ error: 'User not found' });
        }
        console.log('User found:', { id: user._id, firebaseUID: user.firebaseUID });
        const topic = user.topics.id(topicId);
        if (!topic || !topic.categories) {
            console.log('Topic not found or invalid structure:', { topicId, foundTopic: !!topic });
            return res.status(404).json({ error: 'Topic not found or invalid topic structure' });
        }
        console.log('Topic found:', { id: topic._id, name: topic.name });
        const validCategories = ['webpage', 'video', 'book', 'podcast'];
        if (!validCategories.includes(categoryType)) {
            console.log('Invalid category type:', categoryType);
            return res.status(400).json({ error: 'Invalid category type' });
        }
        const materials = topic.categories[categoryType];
        if (!Array.isArray(materials)) {
            console.log('Category not found or not an array:', { categoryType, isArray: Array.isArray(materials) });
            return res.status(404).json({ error: 'Category not found' });
        }
        console.log('Materials in category:', {
            categoryType,
            count: materials.length,
            materialIds: materials.map((m) => { var _a; return (_a = m._id) === null || _a === void 0 ? void 0 : _a.toString(); })
        });
        const material = materials.find((m) => m._id && m._id.toString() === materialId);
        if (!material) {
            console.log('Material not found in category:', { materialId, categoryType });
            return res.status(404).json({ error: 'Material not found' });
        }
        console.log('Material found:', material);
        console.log('======================\n');
        res.json({ success: true, material });
    }
    catch (error) {
        console.error('Error in test GET route:', error);
        res.status(500).json({
            error: 'Server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Debug: Print all registered routes
console.log('\n=== REGISTERED ROUTES ===');
// Print direct routes
app._router.stack.forEach((middleware, i) => {
    if (middleware.route) {
        const methods = Object.keys(middleware.route.methods).join(',');
        console.log(`[${i}] ${methods.toUpperCase()} ${middleware.route.path}`);
    }
    else if (middleware.name === 'router') {
        console.log(`[${i}] Router middleware: ${middleware.regexp}`);
        // Try to print router paths
        if (middleware.handle && middleware.handle.stack) {
            middleware.handle.stack.forEach((handler, j) => {
                if (handler.route) {
                    const methods = Object.keys(handler.route.methods).join(',');
                    console.log(`  [${i}.${j}] ${methods.toUpperCase()} ${handler.route.path}`);
                }
            });
        }
    }
    else {
        console.log(`[${i}] Middleware: ${middleware.name || 'anonymous'}`);
    }
});
console.log('========================\n');
// Print all routes in a more structured way
console.log('\n=== ALL ROUTES (DETAILED) ===');
function printRoutes(app) {
    const routes = [];
    // Get routes from the main app
    app._router.stack.forEach((middleware) => {
        if (middleware.route) {
            // Routes registered directly on the app
            const methods = Object.keys(middleware.route.methods);
            routes.push({
                method: methods.join(',').toUpperCase(),
                path: middleware.route.path
            });
        }
        else if (middleware.name === 'router') {
            // Router middleware
            const regexp = middleware.regexp.toString();
            // Get the base path from the regexp
            let basePath = '';
            const match = regexp.match(/^\/\^\\\/([^\\]+)/);
            if (match) {
                basePath = '/' + match[1];
            }
            // Get routes from the router
            if (middleware.handle && middleware.handle.stack) {
                middleware.handle.stack.forEach((handler) => {
                    var _a;
                    if (handler.route) {
                        const methods = Object.keys(handler.route.methods);
                        const routePath = handler.route.path;
                        const fullPath = routePath.startsWith('/')
                            ? basePath + routePath.substring(1) // Handle paths with leading slash
                            : basePath + '/' + routePath; // Handle paths without leading slash
                        routes.push({
                            method: methods.join(',').toUpperCase(),
                            path: fullPath,
                            regexp: (_a = handler.regexp) === null || _a === void 0 ? void 0 : _a.toString()
                        });
                    }
                });
            }
        }
    });
    // Sort and print routes
    routes.sort((a, b) => a.path.localeCompare(b.path));
    routes.forEach((route, i) => {
        console.log(`[${i}] ${route.method} ${route.path}`);
        if (route.regexp) {
            console.log(`    RegExp: ${route.regexp}`);
        }
    });
}
printRoutes(app);
console.log('========================\n');
// Debug route to list all routes
app.get('/debug/routes', (req, res) => {
    console.log('Debug route hit - listing all routes');
    const routes = [];
    // Get routes from the main app
    app._router.stack.forEach((middleware) => {
        if (middleware.route) {
            // Routes registered directly on the app
            const methods = Object.keys(middleware.route.methods);
            routes.push({
                method: methods.join(',').toUpperCase(),
                path: middleware.route.path
            });
        }
        else if (middleware.name === 'router') {
            // Router middleware
            const regexp = middleware.regexp.toString();
            // Get the base path from the regexp
            let basePath = '';
            const match = regexp.match(/^\/\^\\\/([^\\]+)/);
            if (match) {
                basePath = '/' + match[1];
            }
            // Get routes from the router
            if (middleware.handle && middleware.handle.stack) {
                middleware.handle.stack.forEach((handler) => {
                    if (handler.route) {
                        const methods = Object.keys(handler.route.methods);
                        const routePath = handler.route.path;
                        const fullPath = routePath.startsWith('/')
                            ? basePath + routePath.substring(1) // Handle paths with leading slash
                            : basePath + '/' + routePath; // Handle paths without leading slash
                        routes.push({
                            method: methods.join(',').toUpperCase(),
                            path: fullPath
                        });
                    }
                });
            }
        }
    });
    // Sort routes
    routes.sort((a, b) => a.path.localeCompare(b.path));
    res.json({
        routes,
        count: routes.length
    });
});
// Add a direct debug route for the delete material endpoint
app.get('/debug/delete-route', (req, res) => {
    const userId = req.query.userId || 'aot39WjGKBW3ZhnnwPtZZmfXBfi2';
    const topicId = req.query.topicId || '67a4c31ded27b56fc01cb08e';
    const categoryType = req.query.categoryType || 'webpage';
    const materialId = req.query.materialId || '67bb5fbab51519857a1d15a0';
    const deleteRoute = `/api/users/${userId}/topics/${topicId}/categories/${categoryType}/materials/${materialId}`;
    res.json({
        deleteRoute,
        directRouteExists: true,
        userRoutesExists: true,
        params: {
            userId,
            topicId,
            categoryType,
            materialId
        }
    });
});
// Error handling middleware
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
};
app.use(errorHandler);
// 404 handler
app.use('*', (req, res) => {
    console.log('Route not found:', req.method, req.originalUrl);
    res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl,
        method: req.method
    });
});
// Export for testing
exports.default = app;
