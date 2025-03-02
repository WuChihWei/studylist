"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTopicName = exports.validateRating = exports.validateMaterialType = exports.validateRequest = void 0;
// 简单验证函数，确保请求主体中包含所需字段
const validateRequest = (requiredFields) => {
    return (req, res, next) => {
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
exports.validateRequest = validateRequest;
// 材料类型验证
const validateMaterialType = (req, res, next) => {
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
exports.validateMaterialType = validateMaterialType;
// 验证材料评分
const validateRating = (req, res, next) => {
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
exports.validateRating = validateRating;
// 主题名称验证
const validateTopicName = (req, res, next) => {
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
exports.validateTopicName = validateTopicName;
