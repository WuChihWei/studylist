import { Router, Request, Response } from 'express';
import { User } from '../models/User';
import { authMiddleware } from '../middleware/auth';
import { DecodedIdToken } from 'firebase-admin/auth';
import { RequestHandler } from 'express';
import { Types } from 'mongoose';

// 定義材料的類型
interface Material {
  _id: Types.ObjectId;
  type: CategoryType;
  completed: boolean;
  dateAdded: Date;
  title?: string;
  url?: string;
  rating?: number;
  notes?: string;
}

type CategoryType = 'webpage' | 'video' | 'podcast' | 'book';

interface Categories {
  webpage: Material[];
  video: Material[];
  podcast: Material[];
  book: Material[];
}

interface AuthRequest extends Request {
  user?: DecodedIdToken & { firebaseUID: string };
}

const router = Router({ mergeParams: true });

router.use(authMiddleware);

const deleteMaterial: RequestHandler = async (req, res) => {
  try {
    const { firebaseUID, topicId, materialId } = req.params;
    
    console.log('Delete material request:', {
      params: { firebaseUID, topicId, materialId }
    });

    const user = await User.findOne({ firebaseUID });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const topic = user.topics.id(topicId);
    if (!topic || !topic.categories) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    let materialDeleted = false;
    const categoryTypes = ['webpage', 'video', 'podcast', 'book'] as const;
    
    for (const type of categoryTypes) {
      const materials = topic.categories[type];
      if (!Array.isArray(materials)) continue;

      const materialIndex = materials.findIndex(
        (m: { _id?: Types.ObjectId }) => m._id?.toString() === materialId
      );
      
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
    return res.status(200).json({ message: 'Material deleted successfully' });
  } catch (error) {
    console.error('Error deleting material:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

// DELETE /api/users/:firebaseUID/topics/:topicId/materials/:materialId
router.delete('/:materialId', deleteMaterial);

export default router;