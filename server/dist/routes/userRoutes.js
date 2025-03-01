"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Public routes (no auth required)
router.post('/', userController_1.createUser);
// Protected routes
router.use(auth_1.authMiddleware);
router.get('/:firebaseUID', userController_1.getUserByFirebaseUID);
router.put('/:firebaseUID', userController_1.updateUser);
router.delete('/:firebaseUID', userController_1.deleteUser);
router.get('/:firebaseUID/materials', userController_1.getUserMaterials);
router.post('/:firebaseUID/materials', userController_1.addMaterial);
router.put('/:firebaseUID/profile', userController_1.updateUserProfile);
router.post('/:firebaseUID/topics', userController_1.addTopic);
router.put('/:firebaseUID/topics/:topicId', userController_1.updateTopicName);
router.post('/users/update-all-bios', userController_1.updateAllUsersBio);
// Material deletion route - this needs to match exactly what the client is sending
// The client sends: /api/users/:userId/topics/:topicId/categories/:categoryType/materials/:materialId
// Since this router is mounted at /api, we need to define the route as:
router.delete('users/:userId/topics/:topicId/categories/:categoryType/materials/:materialId', (req, res, next) => {
    console.log('\n=== USER ROUTES DELETE MATERIAL HANDLER ===');
    console.log('Route path in userRoutes:', 'users/:userId/topics/:topicId/categories/:categoryType/materials/:materialId');
    console.log('Request params:', {
        userId: req.params.userId,
        topicId: req.params.topicId,
        categoryType: req.params.categoryType,
        materialId: req.params.materialId
    });
    console.log('Request path:', req.path);
    console.log('Original URL:', req.originalUrl);
    console.log('Router base path:', req.baseUrl);
    console.log('======================\n');
    next();
}, userController_1.deleteMaterial);
exports.default = router;
