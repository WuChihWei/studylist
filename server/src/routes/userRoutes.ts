import { Router } from 'express';
import { 
  getUserByFirebaseUID, 
  updateUser, 
  deleteUser,
  getUserMaterials,
  createUser,
  updateUserProfile,
  updateAllUsersBio
} from '../controllers/userController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Public routes (no auth required)
router.post('/', createUser);

// Protected routes
router.use(authMiddleware);
router.get('/:userId', getUserByFirebaseUID);
router.put('/:userId', updateUser);
router.delete('/:userId', deleteUser);
router.get('/:userId/materials', getUserMaterials);
router.put('/:userId/profile', updateUserProfile);
router.post('/update-all-bios', updateAllUsersBio);

export default router;