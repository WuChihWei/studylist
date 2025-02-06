import { Router } from 'express';
import { addTopic, addMaterial } from '../controllers/userController';
import { authMiddleware } from '../middleware/auth';

const router = Router({ mergeParams: true });

// 添加身份驗證中間件
router.use(authMiddleware);

// POST /api/users/:firebaseUID/topics
router.post('/:firebaseUID/topics', addTopic);

// 添加 topic
router.post('/', addTopic);

// 添加 material 到特定 topic
router.post('/:topicId/materials', addMaterial);

router.put('/:topicId/materials/:materialId/complete', async (req, res) => {
  try {
    // 實現材料完成狀態的切換邏輯
    // 返回更新後的用戶數據
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update material status' });
  }
});

console.log('Topics routes initialized');

export default router;