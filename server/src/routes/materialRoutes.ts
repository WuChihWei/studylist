import { Router } from 'express';
import { 
  deleteMaterial,
  updateMaterialProgress,
  reorderMaterials
} from '../controllers/materialController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Add authentication middleware for all routes
router.use(authMiddleware);

// 重新排序材料
router.put('/reorder', reorderMaterials);

// 更新材料進度
router.patch('/:materialId/progress', updateMaterialProgress);

// 刪除材料
router.delete('/:materialId', deleteMaterial);

export default router;
