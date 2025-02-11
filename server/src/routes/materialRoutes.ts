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
    
    console.log('Delete material request:', {
      params: { firebaseUID, topicId, materialId },
      query: { type, index }
    });

    if (!firebaseUID || !type || index === undefined) {
      console.log('Missing parameters:', { firebaseUID, type, index });
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const materialType = type as CategoryType;
    if (!['webpage', 'video', 'podcast', 'book'].includes(materialType)) {
      console.log('Invalid material type:', materialType);
      return res.status(400).json({ error: 'Invalid material type' });
    }

    const materialIndex = parseInt(index as string);
    if (isNaN(materialIndex)) {
      console.log('Invalid index:', index);
      return res.status(400).json({ error: 'Invalid index' });
    }

    const user = await User.findOne({ firebaseUID });
    console.log('Found user:', !!user);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const topic = user.topics.id(topicId);
    console.log('Found topic:', !!topic);
    
    if (!topic || !topic.categories) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    const materials = topic.categories[materialType];
    console.log('Materials array:', {
      type: materialType,
      categories: topic.categories,
      materials,
      length: materials?.length,
      requestedIndex: materialIndex
    });

    if (!topic.categories[materialType]) {
      return res.status(404).json({ error: `Category ${materialType} not found` });
    }

    if (!Array.isArray(materials) || materialIndex >= materials.length) {
      return res.status(404).json({ 
        error: 'Invalid material index',
        availableLength: materials?.length || 0,
        requestedIndex: materialIndex
      });
    }

    if (materials[materialIndex]._id.toString() !== materialId) {
      return res.status(400).json({ 
        error: 'Material ID mismatch',
        expected: materialId,
        found: materials[materialIndex]._id
      });
    }

    materials.splice(materialIndex, 1);
    await user.save();
    console.log('Material deleted successfully');

    return res.status(200).json({ message: 'Material deleted successfully' });
  } catch (error) {
    console.error('Error deleting material:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

router.delete('/:firebaseUID/topics/:topicId/materials/:materialId', deleteMaterial);

export default router;