import { Router } from 'express';
import { addTopic, updateTopicName, deleteTopic } from '../controllers/topicController';
import { 
  addMaterial, 
  completeMaterial, 
  uncompleteMaterial, 
  updateMaterialProgress, 
  deleteMaterial 
} from '../controllers/materialController';
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
router.delete('/:topicId/materials/:materialId', deleteMaterial);

console.log('Topic routes initialized');

export default router;