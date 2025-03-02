"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMaterial = exports.deleteMaterialSimple = exports.updateMaterialProgress = exports.uncompleteMaterial = exports.completeMaterial = exports.addMaterial = void 0;
const User_1 = require("../models/User");
const appError_1 = require("../middleware/appError");
const mongoose_1 = __importDefault(require("mongoose"));
// 添加材料
exports.addMaterial = (0, appError_1.catchAsync)(async (req, res) => {
    const { userId, topicId } = req.params;
    const { type, title, url, rating } = req.body;
    const user = await User_1.User.findOne({ firebaseUID: userId });
    if (!user) {
        throw new appError_1.AppError('User not found', 404);
    }
    const topic = user.topics.find(t => { var _a; return ((_a = t._id) === null || _a === void 0 ? void 0 : _a.toString()) === topicId; });
    if (!topic) {
        throw new appError_1.AppError('Topic not found', 404);
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
        throw new appError_1.AppError('Topic categories not found', 404);
    }
    // 将材料添加到相应类别
    const materialType = type;
    if (!topic.categories[materialType]) {
        throw new appError_1.AppError('Invalid material type', 400);
    }
    topic.categories[materialType].push(newMaterial);
    await user.save();
    res.status(201).json(user);
});
// 完成材料
exports.completeMaterial = (0, appError_1.catchAsync)(async (req, res) => {
    var _a;
    const { userId, topicId, materialId } = req.params;
    const user = await User_1.User.findOne({ firebaseUID: userId });
    if (!user) {
        throw new appError_1.AppError('User not found', 404);
    }
    const topic = user.topics.find(t => { var _a; return ((_a = t._id) === null || _a === void 0 ? void 0 : _a.toString()) === topicId; });
    if (!topic) {
        throw new appError_1.AppError('Topic not found', 404);
    }
    if (!topic.categories) {
        throw new appError_1.AppError('Topic categories not found', 404);
    }
    let materialFound = false;
    for (const type of ['webpage', 'video', 'podcast', 'book']) {
        const material = (_a = topic.categories[type]) === null || _a === void 0 ? void 0 : _a.find(m => { var _a; return ((_a = m._id) === null || _a === void 0 ? void 0 : _a.toString()) === materialId; });
        if (material) {
            material.completed = true;
            materialFound = true;
            break;
        }
    }
    if (!materialFound) {
        throw new appError_1.AppError('Material not found', 404);
    }
    // 更新贡献记录
    const today = new Date().toISOString().split('T')[0];
    const existingContribution = user.contributions.find(c => c.date === today);
    if (existingContribution) {
        existingContribution.studyCount += 1;
    }
    else {
        user.contributions.push({ date: today, count: 0, studyCount: 1 });
    }
    await user.save();
    res.status(200).json(user);
});
// 取消完成材料
exports.uncompleteMaterial = (0, appError_1.catchAsync)(async (req, res) => {
    var _a;
    const { userId, topicId, materialId } = req.params;
    const user = await User_1.User.findOne({ firebaseUID: userId });
    if (!user) {
        throw new appError_1.AppError('User not found', 404);
    }
    const topic = user.topics.find(t => { var _a; return ((_a = t._id) === null || _a === void 0 ? void 0 : _a.toString()) === topicId; });
    if (!topic) {
        throw new appError_1.AppError('Topic not found', 404);
    }
    if (!topic.categories) {
        throw new appError_1.AppError('Topic categories not found', 404);
    }
    let materialFound = false;
    for (const type of ['webpage', 'video', 'podcast', 'book']) {
        const material = (_a = topic.categories[type]) === null || _a === void 0 ? void 0 : _a.find(m => { var _a; return ((_a = m._id) === null || _a === void 0 ? void 0 : _a.toString()) === materialId; });
        if (material) {
            material.completed = false;
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
// 更新材料进度
exports.updateMaterialProgress = (0, appError_1.catchAsync)(async (req, res, next) => {
    var _a;
    const { userId, topicId, materialId } = req.params;
    const { completedUnits, readingTime, progress } = req.body;
    const user = await User_1.User.findOne({ firebaseUID: userId });
    if (!user) {
        throw new appError_1.AppError('User not found', 404);
    }
    const topic = user.topics.find(t => { var _a; return ((_a = t._id) === null || _a === void 0 ? void 0 : _a.toString()) === topicId; });
    if (!topic) {
        throw new appError_1.AppError('Topic not found', 404);
    }
    if (!topic.categories) {
        throw new appError_1.AppError('Topic categories not found', 404);
    }
    let materialFound = false;
    for (const type of ['webpage', 'video', 'podcast', 'book']) {
        const material = (_a = topic.categories[type]) === null || _a === void 0 ? void 0 : _a.find(m => { var _a; return ((_a = m._id) === null || _a === void 0 ? void 0 : _a.toString()) === materialId; });
        if (material) {
            if (completedUnits !== undefined)
                material.completedUnits = completedUnits;
            if (readingTime !== undefined)
                material.readingTime = readingTime;
            if (progress !== undefined)
                material.progress = progress;
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
// 添加这个方法来处理通过查询参数删除材料
const deleteMaterialSimple = async (req, res) => {
    try {
        const { userId, topicId, materialId } = req.query;
        console.log(`Attempting to delete material: ${materialId} from topic ${topicId} for user ${userId}`);
        if (!userId || !topicId || !materialId) {
            return res.status(400).json({ message: 'Missing required parameters' });
        }
        // 查找用户并使用$pull从数组中移除材料
        const result = await User_1.User.findOneAndUpdate({
            _id: userId,
            "topics._id": topicId
        }, {
            $pull: {
                "topics.$.materials": {
                    _id: new mongoose_1.default.Types.ObjectId(materialId)
                }
            }
        }, { new: true });
        if (!result) {
            console.log(`Material not found or already deleted. UserId: ${userId}, TopicId: ${topicId}, MaterialId: ${materialId}`);
            return res.status(404).json({ message: 'Material not found' });
        }
        console.log(`Material successfully deleted. MaterialId: ${materialId}`);
        return res.status(200).json({ message: 'Material deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting material:', error);
        return res.status(500).json({ message: 'Error deleting material', error: error.message });
    }
};
exports.deleteMaterialSimple = deleteMaterialSimple;
// RESTful风格的删除方法（可选，用于未来改进）
const deleteMaterial = async (req, res, next) => {
    try {
        const { userId, topicId, materialId } = req.params;
        // 遍历所有可能的材料类型
        const materialTypes = ['webpage', 'book', 'video', 'podcast'];
        let materialDeleted = false;
        for (const type of materialTypes) {
            // 构建更新路径
            const updatePath = `topics.$.categories.${type}`;
            // 使用MongoDB的$pull操作符从数组中删除匹配的项
            const result = await User_1.User.updateOne({
                firebaseUID: userId,
                "topics._id": topicId
            }, {
                $pull: {
                    [updatePath]: { _id: new mongoose_1.default.Types.ObjectId(materialId) }
                }
            });
            if (result.modifiedCount > 0) {
                materialDeleted = true;
                break;
            }
        }
        if (!materialDeleted) {
            throw new appError_1.AppError('Material not found', 404);
        }
        // 获取更新后的用户数据
        const updatedUser = await User_1.User.findOne({ firebaseUID: userId });
        res.status(200).json(updatedUser);
    }
    catch (error) {
        console.error('Error deleting material:', error);
        return res.status(500).json({ message: 'Error deleting material', error: error.message });
    }
};
exports.deleteMaterial = deleteMaterial;
