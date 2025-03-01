import { Request, Response, NextFunction } from 'express';

// 简单验证函数，确保请求主体中包含所需字段
export const validateRequest = (requiredFields: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        status: 'fail',
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }
    
    next();
  };
};

// 材料类型验证
export const validateMaterialType = (req: Request, res: Response, next: NextFunction) => {
  const { type } = req.body;
  const validTypes = ['webpage', 'video', 'podcast', 'book'];
  
  if (!type || !validTypes.includes(type)) {
    return res.status(400).json({
      status: 'fail',
      message: `Invalid material type. Must be one of: ${validTypes.join(', ')}`
    });
  }
  
  next();
};

// 验证材料评分
export const validateRating = (req: Request, res: Response, next: NextFunction) => {
  const { rating } = req.body;
  
  if (rating !== undefined) {
    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({
        status: 'fail',
        message: 'Rating must be a number between 1 and 5'
      });
    }
    
    // 将字符串转换为数字
    req.body.rating = numRating;
  }
  
  next();
};

// 主题名称验证
export const validateTopicName = (req: Request, res: Response, next: NextFunction) => {
  const { name } = req.body;
  
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({
      status: 'fail',
      message: 'Topic name is required and cannot be empty'
    });
  }
  
  // 裁剪名称中的空白字符
  req.body.name = name.trim();
  
  next();
}; 