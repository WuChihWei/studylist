import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { catchAsync, AppError } from '../middleware/appError';
import mongoose from 'mongoose';

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
export const updateMaterialProgress = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
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
export const deleteMaterial = async (req: Request, res: Response, next: NextFunction) => {
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