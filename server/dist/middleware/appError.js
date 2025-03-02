"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.catchAsync = exports.errorHandler = exports.AppError = void 0;
// 自定义应用错误类
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
// 处理操作性错误的中间件
const errorHandler = (err, req, res, next) => {
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
exports.errorHandler = errorHandler;
// 捕获异步错误的工具函数
const catchAsync = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};
exports.catchAsync = catchAsync;
