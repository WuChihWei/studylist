import express from 'express';
import { Request, Response, NextFunction } from 'express';
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
import { catchAsync } from '../utils/catchAsync';
import * as materialController from '../controllers/materialController';

const router = express.Router();

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
router.delete('/:userId/topics/:topicId/materials/:materialId', catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  console.log('⭐ DELETE MATERIAL - Route Handler');
  await materialController.deleteMaterial(req, res, next);
}));

export default router;