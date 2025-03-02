import { Router, Request, Response, NextFunction } from 'express';
import { deleteMaterial, updateMaterialProgress } from '../controllers/materialController';
import { authMiddleware } from '../middleware/auth';
import { catchAsync } from '../utils/catchAsync';

const router = Router();

// Add authentication middleware
router.use(authMiddleware);

// Log middleware for debugging
router.use((req, res, next) => {
  console.log('Material route accessed:', {
    method: req.method,
    path: req.originalUrl,
    params: req.params,
    body: req.body
  });
  next();
});

// Material deletion route - simplified standalone route
router.delete('/:materialId', (req: Request, res: Response, next: NextFunction) => {
  // Cast to any temporarily to set params without TypeScript errors
  const reqWithParams = req as any;
  reqWithParams.params.userId = req.query.userId as string;
  reqWithParams.params.topicId = req.query.topicId as string;
  
  console.log('Material delete route hit with:', {
    materialId: req.params.materialId,
    userId: reqWithParams.params.userId,
    topicId: reqWithParams.params.topicId
  });
  
  return deleteMaterial(reqWithParams, res, next);
});

// Material progress update route
router.put('/:materialId/progress', (req: Request, res: Response, next: NextFunction) => {
  // Cast to any temporarily to set params without TypeScript errors
  const reqWithParams = req as any;
  reqWithParams.params.userId = req.query.userId as string;
  reqWithParams.params.topicId = req.query.topicId as string;
  
  console.log('Material progress update route hit with:', {
    materialId: req.params.materialId,
    userId: reqWithParams.params.userId,
    topicId: reqWithParams.params.topicId,
    body: req.body
  });
  
  return updateMaterialProgress(reqWithParams, res, next);
});

// Example route - replace with actual implementation when needed
// router.get('/path', authMiddleware, (req: Request, res: Response) => {
//   res.json({ message: 'Path endpoint' });
// });

// RESTful route as future improvement
router.delete('/api/users/:userId/topics/:topicId/materials/:materialId', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  return deleteMaterial(req, res, next);
});

console.log('Material routes initialized');

export default router;
