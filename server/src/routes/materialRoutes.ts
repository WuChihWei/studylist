import { Router, Request, Response } from 'express';
import { User } from '../models/User';
import { authMiddleware } from '../middleware/auth';
import { DecodedIdToken } from 'firebase-admin/auth';
import { RequestHandler } from 'express';

interface AuthRequest extends Request {
  user?: DecodedIdToken & { firebaseUID: string };
}

const router = Router({ mergeParams: true });

router.use(authMiddleware);

const deleteMaterial: RequestHandler<any, any, any, any, { user?: DecodedIdToken & { firebaseUID: string } }> = async (req, res) => {
  try {
    const { topicId, materialId } = req.params;
    const firebaseUID = (req as AuthRequest).user?.firebaseUID;

    if (!firebaseUID) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await User.findOne({ firebaseUID });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const topic = user.topics.id(topicId);
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    const categoryTypes = ['webpage', 'video', 'podcast', 'book'] as const;
    let materialFound = false;

    categoryTypes.forEach(category => {
      if (!topic.categories || !topic.categories[category]) return;
      
      const materials = topic.categories[category];
      const index = materials.findIndex((m: { _id: { toString: () => string } }) => 
        m._id.toString() === materialId
      );
      
      if (index !== -1) {
        materials.splice(index, 1);
        materialFound = true;
      }
    });

    if (!materialFound) {
      return res.status(404).json({ error: 'Material not found' });
    }

    await user.save();
    return res.status(200).json({ message: 'Material deleted successfully' });
  } catch (error) {
    console.error('Error deleting material:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

router.delete('/:topicId/:materialId', deleteMaterial);

export default router;