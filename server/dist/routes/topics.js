"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const auth_1 = require("../middleware/auth");
const User_1 = require("../models/User");
const router = (0, express_1.Router)({ mergeParams: true });
// 添加身份驗證中間件
router.use(auth_1.authMiddleware);
// 添加路由日誌中間件
router.use((req, res, next) => {
    console.log('Route accessed:', {
        method: req.method,
        path: req.originalUrl,
        params: req.params,
        body: req.body
    });
    next();
});
// 材料相關路由
router.post('/:topicId/materials', userController_1.addMaterial);
router.put('/:topicId/materials/:materialId/complete', userController_1.completeMaterial);
router.put('/:topicId/materials/:materialId/uncomplete', userController_1.uncompleteMaterial);
router.put('/:topicId/materials/:materialId/progress', userController_1.updateMaterialProgress);
router.delete('/:topicId/materials/:materialId', async (req, res) => {
    try {
        const { firebaseUID } = req.params;
        const { topicId, materialId } = req.params;
        const user = await User_1.User.findOne({ firebaseUID });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const topic = user.topics.find(t => { var _a; return ((_a = t._id) === null || _a === void 0 ? void 0 : _a.toString()) === topicId; });
        if (!topic || !topic.categories) {
            return res.status(404).json({ error: 'Topic not found' });
        }
        let materialDeleted = false;
        // 遍歷所有類別查找並刪除指定 ObjectId 的材料
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
        console.error('Error deleting material:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
// 更新所有現有材料的路由
router.put('/materials/update-all', userController_1.updateExistingMaterials);
// 主題相關路由
router.post('/', userController_1.addTopic);
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
