import { Request, Response } from 'express';
import { User } from '../models/User';
import { catchAsync, AppError } from '../middleware/appError';

// 添加主题
export const addTopic = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { name } = req.body;

  if (!name) {
    throw new AppError('Topic name is required', 400);
  }

  const user = await User.findOne({ firebaseUID: userId });
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const newTopic = {
    name,
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

// 更新主题名称
export const updateTopicName = catchAsync(async (req: Request, res: Response) => {
  const { userId, topicId } = req.params;
  const { name } = req.body;

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
  await user.save();
  res.status(200).json(user);
});

// 删除主题
export const deleteTopic = catchAsync(async (req: Request, res: Response) => {
  const { userId, topicId } = req.params;
  
  const user = await User.findOneAndUpdate(
    { firebaseUID: userId },
    { $pull: { topics: { _id: topicId } } },
    { new: true }
  );

  if (!user) {
    throw new AppError('User or topic not found', 404);
  }

  res.status(200).json(user);
}); 