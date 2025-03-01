import { Request, Response } from 'express';
import { User } from '../models/User';
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

// 删除材料
export const deleteMaterial = catchAsync(async (req: Request, res: Response) => {
  console.log('=== deleteMaterial controller called ===');
  console.log('Route parameters:', req.params);
  console.log('Query parameters:', req.query);
  
  const { userId, topicId, materialId, materialType } = req.params;
  
  if (!userId || !topicId || !materialId) {
    console.error('Missing required parameters:', { userId, topicId, materialId });
    throw new AppError('Missing required parameters', 400);
  }
  
  console.log('Deleting material:', {
    userId: userId,
    topicId: topicId,
    materialId: materialId,
    materialType: materialType || '未指定' // 记录材料类型，如果提供
  });

  // Validate MongoDB ObjectId format (24 hex characters)
  const validObjectId = /^[0-9a-fA-F]{24}$/;
  if (!validObjectId.test(topicId) || !validObjectId.test(materialId)) {
    console.error('Invalid ID format:', { 
      topicId: { value: topicId, valid: validObjectId.test(topicId) },
      materialId: { value: materialId, valid: validObjectId.test(materialId) }
    });
    throw new AppError('Invalid ID format', 400);
  }

  const user = await User.findOne({ firebaseUID: userId });
  if (!user) {
    console.error('User not found with firebaseUID:', userId);
    throw new AppError('User not found', 404);
  }
  console.log('Found user:', user.name || user.email);

  const topic = user.topics.find(t => t._id?.toString() === topicId);
  if (!topic) {
    console.error('Topic not found with ID:', topicId);
    console.log('Available topic IDs:', user.topics.map(t => t._id?.toString()));
    throw new AppError('Topic not found', 404);
  }
  
  if (!topic.categories) {
    console.error('Topic categories not found for topic:', topic.name);
    throw new AppError('Topic categories not found', 404);
  }
  console.log('Found topic:', topic.name);

  let materialDeleted = false;
  
  // 如果提供了特定材料类型，则优先尝试
  if (materialType && ['webpage', 'video', 'podcast', 'book'].includes(materialType)) {
    console.log(`尝试在指定的类型 ${materialType} 中删除材料`);
    const materials = topic.categories[materialType as MaterialType];
    if (Array.isArray(materials)) {
      console.log(`检查 ${materials.length} 个材料`);
      const materialIndex = materials.findIndex(m => m._id?.toString() === materialId);
      if (materialIndex !== -1) {
        console.log(`在类型 ${materialType} 中找到材料，索引为 ${materialIndex}`);
        materials.splice(materialIndex, 1);
        materialDeleted = true;
      } else {
        console.log(`在类型 ${materialType} 中未找到ID为 ${materialId} 的材料`);
      }
    } else {
      console.log(`类型 ${materialType} 中没有材料`);
    }
  }
  
  // 如果按指定类型未删除成功，则遍历所有类型
  if (!materialDeleted) {
    console.log('尝试在所有类型中查找材料');
    for (const type of ['webpage', 'video', 'podcast', 'book'] as const) {
      const materials = topic.categories[type];
      if (!Array.isArray(materials)) {
        console.log(`No materials in category: ${type}`);
        continue;
      }
      
      console.log(`Checking ${materials.length} materials in category: ${type}`);
      // Log all material IDs in this category for debugging
      console.log(`Material IDs in ${type}:`, materials.map(m => m._id?.toString()));
      
      const materialIndex = materials.findIndex(m => m._id?.toString() === materialId);
      if (materialIndex !== -1) {
        console.log(`Found material at index ${materialIndex} in category ${type}`);
        materials.splice(materialIndex, 1);
        materialDeleted = true;
        break;
      }
    }
  }

  if (!materialDeleted) {
    console.error('Material not found with ID:', materialId);
    throw new AppError('Material not found', 404);
  }

  console.log('Material deleted successfully, saving user...');
  await user.save();
  console.log('User saved successfully');
  
  res.status(200).json(user);
}); 