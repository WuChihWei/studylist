"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const User_1 = require("../models/User");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)({ mergeParams: true });
router.use(auth_1.authMiddleware);
router.delete('/:topicId/:categoryType/:materialId', auth_1.authMiddleware, async (req, res) => {
    var _a;
    try {
        const { topicId, categoryType, materialId } = req.params;
        const user = await User_1.User.findOne({ firebaseUID: (_a = req.user) === null || _a === void 0 ? void 0 : _a.uid });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const topic = user.topics.find(t => { var _a; return ((_a = t._id) === null || _a === void 0 ? void 0 : _a.toString()) === topicId; });
        if (!topic) {
            return res.status(404).json({ error: 'Topic not found' });
        }
        if (!topic.categories) {
            return res.status(404).json({ error: 'Categories not found' });
        }
        const materials = topic.categories[categoryType];
        if (!materials) {
            return res.status(404).json({ error: 'Category type not found' });
        }
        const materialIndex = materials.findIndex(m => { var _a; return ((_a = m._id) === null || _a === void 0 ? void 0 : _a.toString()) === materialId; });
        if (materialIndex === -1) {
            return res.status(404).json({ error: 'Material not found' });
        }
        materials.splice(materialIndex, 1);
        await user.save();
        res.json({ message: 'Material deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Error deleting material' });
    }
});
exports.default = router;
