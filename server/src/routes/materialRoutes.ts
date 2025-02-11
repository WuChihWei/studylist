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
    const { type } = req.query;
    
    if (!firebaseUID) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const materialType = type as CategoryType;
    if (!materialType || !['webpage', 'video', 'podcast', 'book'].includes(materialType)) {
      return res.status(400).json({ error: 'Invalid material type' });
    }

    const user = await User.findOne({ firebaseUID });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const topic = user.topics.id(topicId);
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    if (!topic.categories) {
      return res.status(404).json({ error: 'Categories not found' });
    }

    const materials = topic.categories[materialType];
    if (!Array.isArray(materials)) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const materialIndex = materials.findIndex(m => 
      m._id.toString() === materialId
    );

    if (materialIndex === -1) {
      return res.status(404).json({ error: 'Material not found' });
    }

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