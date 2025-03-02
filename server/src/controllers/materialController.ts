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
  const { userId, topicId, materialId } = req.params;
  
  // 1. 查找用户
  const user = await User.findOne({ firebaseUID: userId });
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  // 2. 查找主题
  const topic = user.topics.find(t => t._id?.toString() === topicId);
  if (!topic || !topic.categories) {
    throw new AppError('Topic not found', 404);
  }
  
  // 3. 在所有材料类别中寻找并删除指定材料
  const materialTypes = ['webpage', 'book', 'video', 'podcast'] as const;
  let materialFound = false;
  
  for (const type of materialTypes) {
    if (!Array.isArray(topic.categories[type])) continue;
    
    const index = topic.categories[type].findIndex(m => m._id?.toString() === materialId);
    if (index !== -1) {
      // 找到材料，从数组中删除
      topic.categories[type].splice(index, 1);
      materialFound = true;
      break;
    }
  }
  
  if (!materialFound) {
    throw new AppError('Material not found', 404);
  }
  
  // 4. 保存用户文档
  await user.save();
  
  // 5. 返回更新后的用户数据
  res.status(200).json(user);
}); 