import { Request, Response, NextFunction } from 'express';

// 异步函数错误捕获工具
export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};

