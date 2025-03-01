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

// Material deletion route - this needs to match exactly what the client is sending
// The client sends: /api/users/:userId/topics/:topicId/categories/:categoryType/materials/:materialId
// Since this router is mounted at /api, we need to define the route as:
router.delete(
  'users/:userId/topics/:topicId/categories/:categoryType/materials/:materialId',
  (req, res, next) => {
    console.log('\n=== USER ROUTES DELETE MATERIAL HANDLER ===');
    console.log('Route path in userRoutes:', 'users/:userId/topics/:topicId/categories/:categoryType/materials/:materialId');
    console.log('Request params:', {
      userId: req.params.userId,
      topicId: req.params.topicId,
      categoryType: req.params.categoryType,
      materialId: req.params.materialId
    });
    console.log('Request path:', req.path);
    console.log('Original URL:', req.originalUrl);
    console.log('Router base path:', req.baseUrl);
    console.log('======================\n');
    next();
  },
  deleteMaterial
);

export default router;