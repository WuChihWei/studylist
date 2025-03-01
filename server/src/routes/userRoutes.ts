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
  updateAllUsersBio,
  deleteMaterial
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

// Fix the delete material route to match the client's request pattern
// The client is sending to /api/users/:userId/topics/:topicId/categories/:categoryType/materials/:materialId
// But the router is mounted at /api, so we need to use users/:userId/... (without the leading slash)
router.delete(
  'users/:userId/topics/:topicId/categories/:categoryType/materials/:materialId',
  (req, res, next) => {
    console.log('Delete material request received:', {
      userId: req.params.userId,
      topicId: req.params.topicId,
      categoryType: req.params.categoryType,
      materialId: req.params.materialId
    });
    next();
  },
  deleteMaterial
);

export default router;