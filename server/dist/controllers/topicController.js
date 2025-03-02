"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMaterial = exports.deleteTopic = exports.updateTopicName = exports.addTopic = void 0;
const User_1 = require("../models/User");
const appError_1 = require("../middleware/appError");
// 添加主题
exports.addTopic = (0, appError_1.catchAsync)(async (req, res) => {
    const { userId } = req.params;
    const { name } = req.body;
    if (!name) {
        throw new appError_1.AppError('Topic name is required', 400);
    }
    const user = await User_1.User.findOne({ firebaseUID: userId });
    if (!user) {
        throw new appError_1.AppError('User not found', 404);
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
    }
    else {
        user.contributions.push({ date: today, count: 1, studyCount: 0 });
    }
    await user.save();
    res.status(201).json(user);
});
// 更新主题名称
exports.updateTopicName = (0, appError_1.catchAsync)(async (req, res) => {
    const { userId, topicId } = req.params;
    const { name } = req.body;
    if (!name) {
        throw new appError_1.AppError('Topic name is required', 400);
    }
    const user = await User_1.User.findOne({ firebaseUID: userId });
    if (!user) {
        throw new appError_1.AppError('User not found', 404);
    }
    const topic = user.topics.find(t => { var _a; return ((_a = t._id) === null || _a === void 0 ? void 0 : _a.toString()) === topicId; });
    if (!topic) {
        throw new appError_1.AppError('Topic not found', 404);
    }
    topic.name = name;
    await user.save();
    res.status(200).json(user);
});
// 删除主题
exports.deleteTopic = (0, appError_1.catchAsync)(async (req, res) => {
    const { userId, topicId } = req.params;
    const user = await User_1.User.findOne({ firebaseUID: userId });
    if (!user) {
        throw new appError_1.AppError('User not found', 404);
    }
    // 查找主题索引
    const topicIndex = user.topics.findIndex(t => { var _a; return ((_a = t._id) === null || _a === void 0 ? void 0 : _a.toString()) === topicId; });
    if (topicIndex === -1) {
        throw new appError_1.AppError('Topic not found', 404);
    }
    // 删除主题
    user.topics.splice(topicIndex, 1);
    await user.save();
    res.status(200).json(user);
});
// 删除材料
exports.deleteMaterial = (0, appError_1.catchAsync)(async (req, res) => {
    const { userId, topicId, materialId } = req.params;
    const user = await User_1.User.findOne({ firebaseUID: userId });
    if (!user) {
        throw new appError_1.AppError('User not found', 404);
    }
    const topic = user.topics.find(t => { var _a; return ((_a = t._id) === null || _a === void 0 ? void 0 : _a.toString()) === topicId; });
    if (!topic || !topic.categories) {
        throw new appError_1.AppError('Topic not found', 404);
    }
    // 遍历所有分类查找并删除材料
    const categoryTypes = ['webpage', 'video', 'podcast', 'book'];
    let materialFound = false;
    for (const type of categoryTypes) {
        const materials = topic.categories[type];
        if (!Array.isArray(materials))
            continue;
        const materialIndex = materials.findIndex(m => { var _a; return ((_a = m._id) === null || _a === void 0 ? void 0 : _a.toString()) === materialId; });
        if (materialIndex !== -1) {
            // 找到材料，删除它
            materials.splice(materialIndex, 1);
            materialFound = true;
            break;
        }
    }
    if (!materialFound) {
        throw new appError_1.AppError('Material not found', 404);
    }
    await user.save();
    res.status(200).json(user);
});
