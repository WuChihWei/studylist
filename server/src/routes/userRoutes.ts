import { Router } from 'express';
import { 
  getUserByFirebaseUID, 
  updateUser, 
  deleteUser,
  getUserMaterials,
  createUser,
  addMaterial
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

export default router;