import { Router } from 'express';
import { 
  getUserByFirebaseUID, 
  updateUser, 
  deleteUser,
  getUserMaterials,
  createUser,
  addMaterial,
  updateUserProfile,
  addTopic,
  updateTopicName,
  updateAllUsersBio
} from '../controllers/userController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Public routes (no auth required)
router.post('/', createUser);

// Protected routes
router.use(authMiddleware);
router.get('/:firebaseUID', getUserByFirebaseUID);
router.put('/:firebaseUID', updateUser);
router.delete('/:firebaseUID', deleteUser);
router.get('/:firebaseUID/materials', getUserMaterials);
router.post('/:firebaseUID/materials', addMaterial);
router.put('/:firebaseUID/profile', updateUserProfile);
router.post('/:firebaseUID/topics', addTopic);
router.put('/:firebaseUID/topics/:topicId', updateTopicName);
router.post('/users/update-all-bios', updateAllUsersBio);

export default router;