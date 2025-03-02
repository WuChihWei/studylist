"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const topicController_1 = require("../controllers/topicController");
const materialController_1 = require("../controllers/materialController");
const auth_1 = require("../middleware/auth");
const validator_1 = require("../middleware/validator");
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
// 主題相關路由
router.post('/', validator_1.validateTopicName, topicController_1.addTopic);
router.put('/:topicId', validator_1.validateTopicName, topicController_1.updateTopicName);
router.delete('/:topicId', topicController_1.deleteTopic);
// 材料相關路由
router.post('/:topicId/materials', validator_1.validateMaterialType, validator_1.validateRating, materialController_1.addMaterial);
router.put('/:topicId/materials/:materialId/complete', materialController_1.completeMaterial);
router.put('/:topicId/materials/:materialId/uncomplete', materialController_1.uncompleteMaterial);
router.put('/:topicId/materials/:materialId/progress', materialController_1.updateMaterialProgress);
// Debug DELETE route - MUST be before the main DELETE route
router.delete('/:topicId/materials/:materialId/debug', (req, res) => {
    console.log('DEBUG DELETE ROUTE HIT');
    console.log('Params:', req.params);
    return res.status(200).json({
        message: 'Debug delete route accessed',
        params: req.params
    });
});
// Main delete route
router.delete('/:topicId/materials/:materialId', materialController_1.deleteMaterial);
console.log('Topic routes initialized with mergeParams:', true);
exports.default = router;
