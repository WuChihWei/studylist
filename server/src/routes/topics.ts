import { Router } from 'express';
import { addTopic, addMaterial, completeMaterial, uncompleteMaterial } from '../controllers/userController';
import { authMiddleware } from '../middleware/auth';

const router = Router({ mergeParams: true });

// 添加身份驗證中間件
router.use(authMiddleware);

// POST /api/users/:firebaseUID/topics
router.post('/', addTopic);

// Add material to specific topic
router.post('/:topicId/materials', addMaterial);

// Complete/uncomplete material
router.put('/:topicId/materials/:materialId/complete', completeMaterial);
router.put('/:topicId/materials/:materialId/uncomplete', uncompleteMaterial);

console.log('Topics routes initialized');

export default router;