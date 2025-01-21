import { Router } from 'express';
import { 
  getUserByFirebaseUID, 
  updateUser, 
  deleteUser,
  getUserMaterials,
  createUser
} from '../controllers/userController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// 使用认证中间件保护路由
router.use(authMiddleware);

// Define your routes
router.get('/:firebaseUID', getUserByFirebaseUID);
router.put('/:firebaseUID', updateUser);
router.delete('/:firebaseUID', deleteUser);
router.get('/:firebaseUID/materials', getUserMaterials);
router.post('/:firebaseUID', createUser);

export default router;