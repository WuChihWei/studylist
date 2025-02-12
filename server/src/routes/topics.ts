import { Router } from 'express';
import { addTopic, addMaterial, completeMaterial, uncompleteMaterial } from '../controllers/userController';
import { authMiddleware } from '../middleware/auth';
import { User } from '../models/User';
import { Request, Response } from 'express';

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