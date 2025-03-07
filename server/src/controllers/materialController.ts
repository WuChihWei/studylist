import { Request, Response } from 'express';
import { User } from '../models/User';
import mongoose from 'mongoose';
import { catchAsync, AppError } from '../middleware/appError';

// 定义材料类型
type MaterialType = 'webpage' | 'video' | 'podcast' | 'book';

// 添加材料
export const addMaterial = catchAsync(async (req: Request, res: Response) => {
  const { userId, topicId } = req.params;
  const { type, title, url, rating } = req.body;

  const user = await User.findOne({ firebaseUID: userId });
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const topic = user.topics.find(t => t._id?.toString() === topicId);
  if (!topic) {
    throw new AppError('Topic not found', 404);
  }

  const newMaterial = {
    type,
    title,
    url,
    rating,
    dateAdded: new Date(),
    completed: false
  };

  // 确保topic.categories存在
  if (!topic.categories) {
    throw new AppError('Topic categories not found', 404);
  }
  
  // 将材料添加到相应类别
  const materialType = type as MaterialType;
  if (!topic.categories[materialType]) {
    throw new AppError('Invalid material type', 400);
  }

  topic.categories[materialType].push(newMaterial);
  await user.save();

  res.status(201).json(user);
});

// 完成材料
export const completeMaterial = catchAsync(async (req: Request, res: Response) => {
  const { userId, topicId, materialId } = req.params;

  const user = await User.findOne({ firebaseUID: userId });
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const topic = user.topics.find(t => t._id?.toString() === topicId);
  if (!topic) {
    throw new AppError('Topic not found', 404);
  }

  if (!topic.categories) {
    throw new AppError('Topic categories not found', 404);
  }

  let materialFound = false;
  for (const type of ['webpage', 'video', 'podcast', 'book'] as const) {
    const material = topic.categories[type]?.find(m => m._id?.toString() === materialId);
    if (material) {
      material.completed = true;
      materialFound = true;
      break;
    }
  }

  if (!materialFound) {
    throw new AppError('Material not found', 404);
  }

  // 更新贡献记录
  const today = new Date().toISOString().split('T')[0];
  const existingContribution = user.contributions.find(c => c.date === today);
  
  if (existingContribution) {
    existingContribution.studyCount += 1;
  } else {
    user.contributions.push({ date: today, count: 0, studyCount: 1 });
  }

  await user.save();
  res.status(200).json(user);
});

// 取消完成材料
export const uncompleteMaterial = catchAsync(async (req: Request, res: Response) => {
  const { userId, topicId, materialId } = req.params;

  const user = await User.findOne({ firebaseUID: userId });
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const topic = user.topics.find(t => t._id?.toString() === topicId);
  if (!topic) {
    throw new AppError('Topic not found', 404);
  }

  if (!topic.categories) {
    throw new AppError('Topic categories not found', 404);
  }

  let materialFound = false;
  for (const type of ['webpage', 'video', 'podcast', 'book'] as const) {
    const material = topic.categories[type]?.find(m => m._id?.toString() === materialId);
    if (material) {
      material.completed = false;
      materialFound = true;
      break;
    }
  }

  if (!materialFound) {
    throw new AppError('Material not found', 404);
  }

  await user.save();
  res.status(200).json(user);
});

// 更新材料进度
export const updateMaterialProgress = catchAsync(async (req: Request, res: Response) => {
  const { userId, topicId, materialId } = req.params;
  const { completedUnits, readingTime, progress } = req.body;

  const user = await User.findOne({ firebaseUID: userId });
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const topic = user.topics.find(t => t._id?.toString() === topicId);
  if (!topic) {
    throw new AppError('Topic not found', 404);
  }

  if (!topic.categories) {
    throw new AppError('Topic categories not found', 404);
  }

  let materialFound = false;
  for (const type of ['webpage', 'video', 'podcast', 'book'] as const) {
    const material = topic.categories[type]?.find(m => m._id?.toString() === materialId);
    if (material) {
      if (completedUnits !== undefined) material.completedUnits = completedUnits;
      if (readingTime !== undefined) material.readingTime = readingTime;
      if (progress !== undefined) material.progress = progress;
      materialFound = true;
      break;
    }
  }

  if (!materialFound) {
    throw new AppError('Material not found', 404);
  }

  await user.save();
  res.status(200).json(user);
});

// 添加这个方法来处理通过查询参数删除材料
export const deleteMaterialSimple = async (req: Request, res: Response) => {
  try {
    const { userId, topicId, materialId } = req.query;
    
    console.log(`Attempting to delete material: ${materialId} from topic ${topicId} for user ${userId}`);
    
    if (!userId || !topicId || !materialId) {
      return res.status(400).json({ message: 'Missing required parameters' });
    }
    
    // 查找用户并使用$pull从数组中移除材料
    const result = await User.findOneAndUpdate(
      { 
        _id: userId, 
        "topics._id": topicId 
      },
      { 
        $pull: { 
          "topics.$.materials": { 
            _id: new mongoose.Types.ObjectId(materialId as string) 
          } 
        } 
      },
      { new: true }
    );
    
    if (!result) {
      console.log(`Material not found or already deleted. UserId: ${userId}, TopicId: ${topicId}, MaterialId: ${materialId}`);
      return res.status(404).json({ message: 'Material not found' });
    }
    
    console.log(`Material successfully deleted. MaterialId: ${materialId}`);
    return res.status(200).json({ message: 'Material deleted successfully' });
  } catch (error) {
    console.error('Error deleting material:', error);
    return res.status(500).json({ message: 'Error deleting material', error: (error as Error).message });
  }
};

// RESTful风格的删除方法（可选，用于未来改进）
export const deleteMaterial = async (req: Request, res: Response) => {
  try {
    const { userId, topicId, materialId } = req.params;
    
    // 遍历所有可能的材料类型
    const materialTypes = ['webpage', 'book', 'video', 'podcast'] as const;
    let materialDeleted = false;
    
    for (const type of materialTypes) {
      // 构建更新路径
      const updatePath = `topics.$.categories.${type}`;
      
      // 使用MongoDB的$pull操作符从数组中删除匹配的项
      const result = await User.updateOne(
        { 
          firebaseUID: userId, 
          "topics._id": topicId 
        },
        { 
          $pull: { 
            [updatePath]: { _id: new mongoose.Types.ObjectId(materialId) } 
          } 
        }
      );
      
      if (result.modifiedCount > 0) {
        materialDeleted = true;
        break;
      }
    }
    
    if (!materialDeleted) {
      throw new AppError('Material not found', 404);
    }
    
    // 获取更新后的用户数据
    const updatedUser = await User.findOne({ firebaseUID: userId });
    res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Error deleting material:', error);
    return res.status(500).json({ message: 'Error deleting material', error: (error as Error).message });
  }
};

// 重新排序材料
export const reorderMaterials = async (req: Request, res: Response) => {
  try {
    console.log('reorderMaterials called with params:', req.params);
    console.log('Body:', req.body);

    // 使用 firebaseUID 作為主要用戶識別符
    let userId = req.params.firebaseUID || req.params.userId;
    
    // 從 token 中也嘗試獲取
    if (!userId && (req as any).user) {
      userId = (req as any).user.uid || (req as any).user.id;
    }
    
    console.log('Using userId:', userId);
    
    const { topicId } = req.params;
    const { materials } = req.body;

    if (!Array.isArray(materials)) {
      return res.status(400).json({ message: '材料必須是一個數組' });
    }

    // 獲取用戶 (使用 firebaseUID)
    const user = await User.findOne({ firebaseUID: userId });
    if (!user) {
      return res.status(404).json({ message: '用戶未找到' });
    }

    // 獲取主題
    const topic = user.topics.find(t => t._id?.toString() === topicId);
    if (!topic) {
      return res.status(404).json({ message: '主題未找到' });
    }

    if (!topic.categories) {
      return res.status(400).json({ message: '主題類別未找到' });
    }

    // 為每個類型創建一個 ID 到 order 的映射
    const orderMaps = {
      webpage: new Map<string, number>(),
      video: new Map<string, number>(),
      podcast: new Map<string, number>(),
      book: new Map<string, number>()
    };

    // 填充順序映射
    materials.forEach((material: any) => {
      if (material._id && typeof material.order === 'number' && material.type) {
        const type = material.type as keyof typeof orderMaps;
        orderMaps[type].set(material._id, material.order);
      }
    });

    // 更新每種類型的材料順序
    for (const type of ['webpage', 'video', 'podcast', 'book'] as const) {
      const typeMaterials = topic.categories[type];
      if (Array.isArray(typeMaterials)) {
        typeMaterials.forEach((material: any) => {
          if (material._id && orderMaps[type].has(material._id.toString())) {
            material.order = orderMaps[type].get(material._id.toString());
          }
        });

        // 按 order 屬性排序材料
        topic.categories[type].sort((a: any, b: any) => {
          const orderA = a.order !== undefined ? a.order : 9999;
          const orderB = b.order !== undefined ? b.order : 9999;
          return orderA - orderB;
        });
      }
    }

    // 保存用戶
    await user.save();

    // 返回完整用戶數據
    res.status(200).json(user);
  } catch (error) {
    console.error('重新排序材料時出錯:', error);
    res.status(500).json({ message: '服務器錯誤' });
  }
}; 