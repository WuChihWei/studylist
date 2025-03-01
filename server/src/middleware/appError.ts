import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';

// 自定义应用错误类
export class AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// 处理操作性错误的中间件
export const errorHandler: ErrorRequestHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  
  // 默认为500内部服务器错误
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  
  // 开发环境返回详细错误信息
  if (process.env.NODE_ENV === 'development') {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  } 
  // 生产环境只返回基本错误信息
  else {
    // 操作性错误：已知可预期的错误
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    } 
    // 编程或未知错误：不泄露错误详情
    else {
      res.status(500).json({
        status: 'error',
        message: 'Something went wrong'
      });
    }
  }
};

// 捕获异步错误的工具函数
export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}; 