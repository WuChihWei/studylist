import { Router } from 'express';
import { addTopic, updateTopicName, deleteTopic } from '../controllers/topicController';
import { 
  addMaterial, 
  completeMaterial, 
  uncompleteMaterial, 
  updateMaterialProgress, 
  deleteMaterial 
} from '../controllers/materialController';
import { 
  saveLearningPath,
  getLearningPath
} from '../controllers/userController';
import { authMiddleware } from '../middleware/auth';
import { validateMaterialType, validateRating, validateTopicName } from '../middleware/validator';

const router = Router({ mergeParams: true });

// 添加身份驗證中間件
router.use(authMiddleware);

// 添加路由日誌中間件
router.use((req, res, next) => {
  console.log('Route accessed:', {
    method: req.method,
    path: req.originalUrl,
    params: req.params,
    body: req.body
  });
  next();
});

// 主題相關路由
router.post('/', validateTopicName, addTopic);
router.put('/:topicId', validateTopicName, updateTopicName);
router.delete('/:topicId', deleteTopic);

// 材料相關路由
router.post('/:topicId/materials', validateMaterialType, validateRating, addMaterial);
router.put('/:topicId/materials/:materialId/complete', completeMaterial);
router.put('/:topicId/materials/:materialId/uncomplete', uncompleteMaterial);
router.put('/:topicId/materials/:materialId/progress', updateMaterialProgress);

// 學習路徑相關路由
router.post('/:topicId/learning-path', saveLearningPath);
router.get('/:topicId/learning-path', getLearningPath);

// Debug DELETE route - MUST be before the main DELETE route
router.delete('/:topicId/materials/:materialId/debug', (req, res) => {
  console.log('DEBUG DELETE ROUTE HIT');
  console.log('Params:', req.params);
  return res.status(200).json({
    message: 'Debug delete route accessed',
    params: req.params
  });
});

// Main delete route
router.delete('/:topicId/materials/:materialId', deleteMaterial);

console.log('Topic routes initialized with mergeParams:', true);

export default router;