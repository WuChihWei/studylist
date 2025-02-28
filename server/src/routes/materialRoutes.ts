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
  completedUnits?: number;
  readingTime?: number;
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

router.delete('/:topicId/:categoryType/:materialId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { topicId, categoryType, materialId } = req.params;
    const user = await User.findOne({ firebaseUID: req.user?.uid });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const topic = user.topics.find(t => t._id?.toString() === topicId);
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    if (!topic.categories) {
      return res.status(404).json({ error: 'Categories not found' });
    }

    const materials = topic.categories[categoryType as CategoryType];
    if (!materials) {
      return res.status(404).json({ error: 'Category type not found' });
    }

    const materialIndex = materials.findIndex(m => m._id?.toString() === materialId);
    if (materialIndex === -1) {
      return res.status(404).json({ error: 'Material not found' });
    }

    materials.splice(materialIndex, 1);
    await user.save();

    res.json({ message: 'Material deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting material' });
  }
});

export default router;