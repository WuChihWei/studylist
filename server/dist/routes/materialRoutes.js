"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const materialController_1 = require("../controllers/materialController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Add authentication middleware
router.use(auth_1.authMiddleware);
// Log middleware for debugging
router.use((req, res, next) => {
    console.log('Material route accessed:', {
        method: req.method,
        path: req.originalUrl,
        params: req.params,
        body: req.body
    });
    next();
});
// Material deletion route - simplified standalone route
router.delete('/:materialId', (req, res, next) => {
    // Cast to any temporarily to set params without TypeScript errors
    const reqWithParams = req;
    reqWithParams.params.userId = req.query.userId;
    reqWithParams.params.topicId = req.query.topicId;
    console.log('Material delete route hit with:', {
        materialId: req.params.materialId,
        userId: reqWithParams.params.userId,
        topicId: reqWithParams.params.topicId
    });
    return (0, materialController_1.deleteMaterial)(reqWithParams, res, next);
});
// Material progress update route
router.put('/:materialId/progress', (req, res, next) => {
    // Cast to any temporarily to set params without TypeScript errors
    const reqWithParams = req;
    reqWithParams.params.userId = req.query.userId;
    reqWithParams.params.topicId = req.query.topicId;
    console.log('Material progress update route hit with:', {
        materialId: req.params.materialId,
        userId: reqWithParams.params.userId,
        topicId: reqWithParams.params.topicId,
        body: req.body
    });
    return (0, materialController_1.updateMaterialProgress)(reqWithParams, res, next);
});
// Example route - replace with actual implementation when needed
// router.get('/path', authMiddleware, (req: Request, res: Response) => {
//   res.json({ message: 'Path endpoint' });
// });
// RESTful route as future improvement
router.delete('/api/users/:userId/topics/:topicId/materials/:materialId', auth_1.authMiddleware, (req, res, next) => {
    return (0, materialController_1.deleteMaterial)(req, res, next);
});
console.log('Material routes initialized');
exports.default = router;
