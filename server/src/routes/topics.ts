import { Router } from 'express';
import { addTopic, addMaterial, completeMaterial, uncompleteMaterial, updateMaterialProgress, updateExistingMaterials } from '../controllers/userController';
import { authMiddleware } from '../middleware/auth';
import { User } from '../models/User';
import { Request, Response } from 'express';

const router = Router({ mergeParams: true });

// 添加身份驗證中間件
router.use(authMiddleware);

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
router.post('/:topicId/materials', addMaterial);
router.put('/:topicId/materials/:materialId/complete', completeMaterial);
router.put('/:topicId/materials/:materialId/uncomplete', uncompleteMaterial);
router.put('/:topicId/materials/:materialId/progress', updateMaterialProgress);

// 更新所有現有材料的路由
router.put('/materials/update-all', updateExistingMaterials);

// 主題相關路由
router.post('/', addTopic);

router.delete('/:topicId', async (req: Request, res: Response) => {
  try {
    const { firebaseUID } = req.params as { firebaseUID: string };
    const { topicId } = req.params;
    
    const user = await User.findOneAndUpdate(
      { firebaseUID },
      { $pull: { topics: { _id: topicId } } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User or topic not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Error deleting topic:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

console.log('Topics routes initialized');

export default router;