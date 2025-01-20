import { Router } from 'express';
import { getUserByFirebaseUID } from '../controllers/userController';

const router = Router();

// Define your routes
router.get('/:firebaseUID', getUserByFirebaseUID);

export default router;