"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reorderMaterials = exports.deleteMaterial = exports.deleteMaterialSimple = exports.updateMaterialProgress = exports.uncompleteMaterial = exports.completeMaterial = exports.addMaterial = void 0;
const User_1 = require("../models/User");
const mongoose_1 = __importDefault(require("mongoose"));
const appError_1 = require("../middleware/appError");
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
exports.updateMaterialProgress = (0, appError_1.catchAsync)(async (req, res) => {
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
const deleteMaterial = async (req, res) => {
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
// 重新排序材料
const reorderMaterials = async (req, res) => {
    try {
        const userId = req.user.id;
        const { topicId } = req.params;
        const { materials } = req.body;
        if (!Array.isArray(materials)) {
            return res.status(400).json({ message: '材料必須是一個數組' });
        }
        // 獲取用戶
        const user = await User_1.User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: '用戶未找到' });
        }
        // 獲取主題
        const topic = user.topics.id(topicId);
        if (!topic) {
            return res.status(404).json({ message: '主題未找到' });
        }
        if (!topic.categories) {
            return res.status(400).json({ message: '主題類別未找到' });
        }
        // 為每個類型創建一個 ID 到 order 的映射
        const orderMaps = {
            webpage: new Map(),
            video: new Map(),
            podcast: new Map(),
            book: new Map()
        };
        // 填充順序映射
        materials.forEach((material) => {
            if (material._id && typeof material.order === 'number' && material.type) {
                const type = material.type;
                orderMaps[type].set(material._id, material.order);
            }
        });
        // 更新每種類型的材料順序
        for (const type of ['webpage', 'video', 'podcast', 'book']) {
            const typeMaterials = topic.categories[type];
            if (Array.isArray(typeMaterials)) {
                typeMaterials.forEach((material) => {
                    if (material._id && orderMaps[type].has(material._id.toString())) {
                        material.order = orderMaps[type].get(material._id.toString());
                    }
                });
                // 按 order 屬性排序材料
                topic.categories[type].sort((a, b) => {
                    const orderA = a.order !== undefined ? a.order : 9999;
                    const orderB = b.order !== undefined ? b.order : 9999;
                    return orderA - orderB;
                });
            }
        }
        // 保存用戶
        await user.save();
        res.status(200).json({ message: '材料順序更新成功' });
    }
    catch (error) {
        console.error('重新排序材料時出錯:', error);
        res.status(500).json({ message: '服務器錯誤' });
    }
};
exports.reorderMaterials = reorderMaterials;
