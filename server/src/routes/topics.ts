import { Router } from 'express';
import { addTopic, addMaterial, completeMaterial, uncompleteMaterial, updateMaterialProgress, updateExistingMaterials } from '../controllers/userController';
import { authMiddleware } from '../middleware/auth';
import { User } from '../models/User';
import { Request, Response } from 'express';
import { DecodedIdToken } from 'firebase-admin/auth';

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
router.delete('/:topicId/materials/:materialId', async (req: Request, res: Response) => {
  try {
    const { firebaseUID } = req.user as DecodedIdToken;
    const { topicId, materialId } = req.params;
    
    const user = await User.findOne({ firebaseUID });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const topic = user.topics.find(t => t._id?.toString() === topicId);
    if (!topic || !topic.categories) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    let materialDeleted = false;
    for (const type of ['webpage', 'video', 'podcast', 'book'] as const) {
      const materials = topic.categories[type];
      if (!Array.isArray(materials)) continue;

      const materialIndex = materials.findIndex(m => m._id?.toString() === materialId);
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
    return res.json({ message: 'Material deleted successfully' });
  } catch (error) {
    console.error('Error deleting material:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

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