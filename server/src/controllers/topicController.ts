import { Request, Response } from 'express';
import { User } from '../models/User';
import { catchAsync, AppError } from '../middleware/appError';

// 添加主题
export const addTopic = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { name, tags, deadline } = req.body;

  if (!name) {
    throw new AppError('Topic name is required', 400);
  }

  const user = await User.findOne({ firebaseUID: userId });
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const newTopic = {
    name,
    tags: tags || [],
    deadline: deadline ? new Date(deadline) : null,
    categories: {
      webpage: [],
      video: [],
      podcast: [],
      book: []
    },
    createdAt: new Date()
  };

  user.topics.push(newTopic);
  
  // 更新贡献记录
  const today = new Date().toISOString().split('T')[0];
  const existingContribution = user.contributions.find(c => c.date === today);
  
  if (existingContribution) {
    existingContribution.count += 1;
  } else {
    user.contributions.push({ date: today, count: 1, studyCount: 0 });
  }

  await user.save();
  res.status(201).json(user);
});

// 更新主题
export const updateTopic = catchAsync(async (req: Request, res: Response) => {
  const { userId, topicId } = req.params;
  const { name, tags, deadline } = req.body;

  if (!name) {
    throw new AppError('Topic name is required', 400);
  }

  const user = await User.findOne({ firebaseUID: userId });
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const topic = user.topics.find(t => t._id?.toString() === topicId);
  if (!topic) {
    throw new AppError('Topic not found', 404);
  }

  topic.name = name;
  
  // 更新标签
  if (tags !== undefined) {
    topic.tags = tags;
  }
  
  // 更新截止日期
  if (deadline !== undefined) {
    topic.deadline = deadline ? new Date(deadline) : undefined;
  }
  
  await user.save();
  res.status(200).json(user);
});

// 删除主题
export const deleteTopic = catchAsync(async (req: Request, res: Response) => {
  const { userId, topicId } = req.params;

  const user = await User.findOne({ firebaseUID: userId });
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // 查找主题索引
  const topicIndex = user.topics.findIndex(t => t._id?.toString() === topicId);
  if (topicIndex === -1) {
    throw new AppError('Topic not found', 404);
  }

  // 删除主题
  user.topics.splice(topicIndex, 1);
  await user.save();

  res.status(200).json(user);
});

// 删除材料
export const deleteMaterial = catchAsync(async (req: Request, res: Response) => {
  const { userId, topicId, materialId } = req.params;

  const user = await User.findOne({ firebaseUID: userId });
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const topic = user.topics.find(t => t._id?.toString() === topicId);
  if (!topic || !topic.categories) {
    throw new AppError('Topic not found', 404);
  }

  // 遍历所有分类查找并删除材料
  const categoryTypes = ['webpage', 'video', 'podcast', 'book'] as const;
  let materialFound = false;
  
  for (const type of categoryTypes) {
    const materials = topic.categories[type];
    if (!Array.isArray(materials)) continue;
    
    const materialIndex = materials.findIndex(m => m._id?.toString() === materialId);
    if (materialIndex !== -1) {
      // 找到材料，删除它
      materials.splice(materialIndex, 1);
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