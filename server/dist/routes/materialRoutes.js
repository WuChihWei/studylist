"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const materialController_1 = require("../controllers/materialController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Add authentication middleware for all routes
router.use(auth_1.authMiddleware);
// 重新排序材料
router.put('/reorder', materialController_1.reorderMaterials);
// 更新材料進度
router.patch('/:materialId/progress', materialController_1.updateMaterialProgress);
// 刪除材料
router.delete('/:materialId', materialController_1.deleteMaterial);
exports.default = router;
