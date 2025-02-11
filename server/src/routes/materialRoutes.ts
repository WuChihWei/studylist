import { Router, Request, Response } from 'express';
import { User } from '../models/User';
import { authMiddleware } from '../middleware/auth';
import { DecodedIdToken } from 'firebase-admin/auth';
import { RequestHandler } from 'express';

type CategoryType = 'webpage' | 'video' | 'podcast' | 'book';

interface Categories {
  webpage: any[];
  video: any[];
  podcast: any[];
  book: any[];
}

interface AuthRequest extends Request {
  user?: DecodedIdToken & { firebaseUID: string };
}

const router = Router({ mergeParams: true });

router.use(authMiddleware);

const deleteMaterial: RequestHandler = async (req, res) => {
  try {
    const { firebaseUID, topicId, materialId } = req.params;
    const { type, index } = req.query;
    
    if (!firebaseUID || !type || index === undefined) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const materialType = type as CategoryType;
    if (!['webpage', 'video', 'podcast', 'book'].includes(materialType)) {
      return res.status(400).json({ error: 'Invalid material type' });
    }

    const materialIndex = parseInt(index as string);
    if (isNaN(materialIndex)) {
      return res.status(400).json({ error: 'Invalid index' });
    }

    const user = await User.findOne({ firebaseUID });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const topic = user.topics.id(topicId);
    if (!topic || !topic.categories) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    const materials = topic.categories[materialType];
    if (!Array.isArray(materials) || materialIndex >= materials.length) {
      return res.status(404).json({ error: 'Invalid material index' });
    }

    // 使用索引直接刪除
    materials.splice(materialIndex, 1);
    await user.save();

    return res.status(200).json({ message: 'Material deleted successfully' });
  } catch (error) {
    console.error('Error deleting material:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

router.delete('/:firebaseUID/topics/:topicId/materials/:materialId', deleteMaterial);

export default router;