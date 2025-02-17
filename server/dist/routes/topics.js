"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const auth_1 = require("../middleware/auth");
const User_1 = require("../models/User");
const router = (0, express_1.Router)({ mergeParams: true });
// 添加身份驗證中間件
router.use(auth_1.authMiddleware);
// POST /api/users/:firebaseUID/topics
router.post('/', userController_1.addTopic);
// Add material to specific topic
router.post('/:topicId/materials', userController_1.addMaterial);
// Complete/uncomplete material
router.put('/:topicId/materials/:materialId/complete', userController_1.completeMaterial);
router.put('/:topicId/materials/:materialId/uncomplete', userController_1.uncompleteMaterial);
router.delete('/:topicId', async (req, res) => {
    try {
        const { firebaseUID } = req.params;
        const { topicId } = req.params;
        const user = await User_1.User.findOneAndUpdate({ firebaseUID }, { $pull: { topics: { _id: topicId } } }, { new: true });
        if (!user) {
            return res.status(404).json({ error: 'User or topic not found' });
        }
        res.status(200).json(user);
    }
    catch (error) {
        console.error('Error deleting topic:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
console.log('Topics routes initialized');
exports.default = router;
