"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMaterial = exports.deleteTopic = exports.updateExistingMaterials = exports.updateMaterialProgress = exports.updateTopic = exports.uncompleteMaterial = exports.completeMaterial = exports.updateAllUsersBio = exports.getUser = exports.updateTopicName = exports.addTopic = exports.updateUserProfile = exports.addMaterial = exports.createUser = exports.getUserMaterials = exports.deleteUser = exports.updateUser = exports.getUserByFirebaseUID = void 0;
const User_1 = require("../models/User");
const mongoose_1 = __importDefault(require("mongoose"));
const getUserByFirebaseUID = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User_1.User.findOne({ firebaseUID: userId });
        if (!user) {
            // Create new user if not found
            const newUser = await User_1.User.create({
                firebaseUID: userId,
                name: 'New User',
                email: req.body.email,
                materials: [
                    { type: 'book', title: 'Sample Book', rating: 4 },
                    { type: 'video', title: 'Sample Video', rating: 5 },
                    { type: 'podcast', title: 'Sample Podcast', rating: 3 }
                ]
            });
            return res.status(201).json(newUser);
        }
        res.status(200).json(user);
    }
    catch (error) {
        console.error('Error fetching user by Firebase UID:', error);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.getUserByFirebaseUID = getUserByFirebaseUID;
const updateUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const updatedUser = await User_1.User.findOneAndUpdate({ firebaseUID: userId }, req.body, { new: true });
        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json(updatedUser);
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};
exports.updateUser = updateUser;
const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const deletedUser = await User_1.User.findOneAndDelete({ firebaseUID: userId });
        if (!deletedUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json({ message: 'User deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};
exports.deleteUser = deleteUser;
const getUserMaterials = async (req, res) => {
    try {
        const { userId, topicId } = req.params;
        const user = await User_1.User.findOne({ firebaseUID: userId });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const topic = user.topics.id(topicId);
        if (!topic) {
            return res.status(404).json({ error: 'Topic not found' });
        }
        res.status(200).json(topic.categories);
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};
exports.getUserMaterials = getUserMaterials;
const createUser = async (req, res) => {
    try {
        const { firebaseUID, name, email } = req.body;
        console.log('Request params:', req.params);
        console.log('Request body:', req.body);
        console.log('Creating user with data:', { firebaseUID, name, email });
        // Check if the user already exists
        const existingUser = await User_1.User.findOne({ firebaseUID });
        console.log('Existing user check result:', existingUser);
        if (existingUser) {
            console.log('User already exists:', existingUser);
            return res.status(400).json({ error: 'User already exists' });
        }
        // Create a new user
        const newUser = await User_1.User.create({
            firebaseUID,
            name,
            email,
            bio: "Introduce yourself",
            materials: []
        });
        console.log('New user created:', newUser);
        // 確認用戶是否真的被保存到數據庫
        const savedUser = await User_1.User.findOne({ firebaseUID });
        console.log('Saved user verification:', savedUser);
        return res.status(201).json(newUser);
    }
    catch (error) {
        console.error('Error creating user:', error);
        // 添加更詳細的錯誤信息
        res.status(500).json({
            error: 'Server error',
            details: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : 'No stack trace available'
        });
    }
};
exports.createUser = createUser;
const addMaterial = async (req, res) => {
    var _a;
    try {
        const { firebaseUID, topicId } = req.params;
        const { type, title, url, rating } = req.body;
        if (!firebaseUID || !topicId) {
            return res.status(400).json({
                error: 'Missing required params'
            });
        }
        // Create new material with progress field
        const newMaterial = {
            type,
            title,
            url: url || null,
            rating: rating || 5,
            dateAdded: new Date(),
            completedUnits: 0,
            readingTime: 0,
            progress: 0,
            completed: false
        };
        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];
        // First, add the material to the topic
        let user = await User_1.User.findOneAndUpdate({
            firebaseUID,
            'topics._id': topicId
        }, {
            $push: { [`topics.$.categories.${type}`]: newMaterial }
        }, { new: true });
        if (!user) {
            return res.status(404).json({ error: 'User or topic not found' });
        }
        // Then, handle the contribution count
        const existingContribution = (_a = user.contributions) === null || _a === void 0 ? void 0 : _a.find(c => c.date === today);
        if (existingContribution) {
            // Update existing contribution
            user = await User_1.User.findOneAndUpdate({
                firebaseUID,
                'contributions.date': today
            }, {
                $inc: { 'contributions.$.count': 1 }
            }, { new: true });
        }
        else {
            // Create new contribution for today
            user = await User_1.User.findOneAndUpdate({ firebaseUID }, {
                $push: {
                    contributions: {
                        date: today,
                        count: 1
                    }
                }
            }, { new: true });
        }
        // Clean up old contributions (older than 9 months)
        const nineMonthsAgo = new Date();
        nineMonthsAgo.setMonth(nineMonthsAgo.getMonth() - 9);
        const cutoffDate = nineMonthsAgo.toISOString().split('T')[0];
        user = await User_1.User.findOneAndUpdate({ firebaseUID }, {
            $pull: {
                contributions: {
                    date: { $lt: cutoffDate }
                }
            }
        }, { new: true });
        res.status(200).json(user);
    }
    catch (error) {
        console.error('Error adding material:', error);
        res.status(500).json({
            error: 'Server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.addMaterial = addMaterial;
const updateUserProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        const { name, bio, photoURL } = req.body;
        console.log(`Updating profile for user ${userId}:`, req.body);
        // 找到用户
        const user = await User_1.User.findOne({ firebaseUID: userId });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // 更新資料
        if (name)
            user.name = name;
        if (bio !== undefined)
            user.bio = bio;
        if (photoURL !== undefined)
            user.photoURL = photoURL;
        await user.save();
        console.log('Profile updated successfully');
        res.status(200).json(user);
    }
    catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.updateUserProfile = updateUserProfile;
const addTopic = async (req, res) => {
    try {
        const { firebaseUID } = req.params;
        const { name } = req.body;
        if (!name) {
            return res.status(400)
                .set('Content-Type', 'application/json')
                .json({ error: 'Topic name is required' });
        }
        const newTopic = {
            name,
            categories: {
                webpage: [],
                video: [],
                book: [],
                podcast: []
            },
            createdAt: new Date()
        };
        const updatedUser = await User_1.User.findOneAndUpdate({ firebaseUID }, { $push: { topics: newTopic } }, { new: true, runValidators: true });
        if (!updatedUser) {
            return res.status(404)
                .set('Content-Type', 'application/json')
                .json({ error: 'User not found' });
        }
        res.status(201)
            .set('Content-Type', 'application/json')
            .json(updatedUser);
    }
    catch (error) {
        console.error('Error adding topic:', error);
        res.status(500)
            .set('Content-Type', 'application/json')
            .json({
            error: 'Server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.addTopic = addTopic;
const updateTopicName = async (req, res) => {
    try {
        const { firebaseUID, topicId } = req.params;
        const { name } = req.body;
        if (!name) {
            return res.status(400)
                .set('Content-Type', 'application/json')
                .json({ error: 'Topic name is required' });
        }
        const updatedUser = await User_1.User.findOneAndUpdate({
            firebaseUID,
            'topics._id': topicId
        }, {
            $set: { 'topics.$.name': name }
        }, {
            new: true,
            runValidators: true
        });
        if (!updatedUser) {
            return res.status(404)
                .set('Content-Type', 'application/json')
                .json({ error: 'User or topic not found' });
        }
        res.status(200)
            .set('Content-Type', 'application/json')
            .json(updatedUser);
    }
    catch (error) {
        console.error('Error updating topic name:', error);
        res.status(500)
            .set('Content-Type', 'application/json')
            .json({
            error: 'Server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.updateTopicName = updateTopicName;
const getUser = async (req, res) => {
    try {
        const { firebaseUID } = req.params;
        if (!mongoose_1.default.connection.readyState) {
            return res.status(503).json({ error: 'Database connection not ready' });
        }
        const user = await User_1.User.findOne({ firebaseUID })
            .select('firebaseUID name email bio materials') // 只選擇需要的字段
            .maxTimeMS(3000) // 降低查詢超時時間
            .lean() // 使用 lean() 提高性能
            .exec();
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        return res.status(200).json(user);
    }
    catch (error) {
        console.error('Get user error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
};
exports.getUser = getUser;
const updateAllUsersBio = async (req, res) => {
    try {
        // Update all users without a bio field
        const result = await User_1.User.updateMany({ bio: { $exists: false } }, { $set: { bio: "Introduce yourself" } });
        res.status(200).json({
            message: 'Bio fields updated successfully',
            modifiedCount: result.modifiedCount
        });
    }
    catch (error) {
        console.error('Error updating users bio:', error);
        res.status(500).json({
            error: 'Server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.updateAllUsersBio = updateAllUsersBio;
const handleContribution = async (userId) => {
    const today = new Date().toISOString().split('T')[0];
    const nineMonthsAgo = new Date();
    nineMonthsAgo.setMonth(nineMonthsAgo.getMonth() - 9);
    const cutoffDate = nineMonthsAgo.toISOString().split('T')[0];
    // Update today's contribution count
    await User_1.User.findOneAndUpdate({
        firebaseUID: userId,
        'contributions.date': today
    }, {
        $inc: { 'contributions.$.count': 1 }
    }, {
        new: true
    });
    // If no contribution record exists for today, create one
    const userWithContribution = await User_1.User.findOne({
        firebaseUID: userId,
        'contributions.date': today
    });
    if (!userWithContribution) {
        await User_1.User.findOneAndUpdate({ firebaseUID: userId }, {
            $push: { contributions: { date: today, count: 1 } }
        });
    }
    // Clean up old contributions
    await User_1.User.findOneAndUpdate({ firebaseUID: userId }, {
        $pull: {
            contributions: {
                date: { $lt: cutoffDate }
            }
        }
    });
};
const completeMaterial = async (req, res) => {
    try {
        const { firebaseUID, topicId, materialId } = req.params;
        const today = new Date().toISOString().split('T')[0];
        const user = await User_1.User.findOne({ firebaseUID });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const topic = user.topics.find(t => { var _a; return ((_a = t._id) === null || _a === void 0 ? void 0 : _a.toString()) === topicId; });
        if (!topic || !topic.categories) {
            return res.status(404).json({ message: 'Topic not found' });
        }
        const categoryTypes = ['webpage', 'video', 'podcast', 'book'];
        for (const type of categoryTypes) {
            const materials = topic.categories[type];
            if (!Array.isArray(materials))
                continue;
            const material = materials.find(m => { var _a; return ((_a = m._id) === null || _a === void 0 ? void 0 : _a.toString()) === materialId; });
            if (material) {
                const isCurrentlyCompleted = material.completed || false;
                const studyCountChange = isCurrentlyCompleted ? -1 : 1; // Decrease if uncompleting, increase if completing
                // Update material completion status and contribution count
                const updatePath = `topics.$[topic].categories.${type}.$[material].completed`;
                const updatedUser = await User_1.User.findOneAndUpdate({
                    firebaseUID,
                    'topics._id': topicId,
                    'contributions.date': today
                }, {
                    $set: { [updatePath]: !isCurrentlyCompleted },
                    $inc: { 'contributions.$[contrib].studyCount': studyCountChange }
                }, {
                    arrayFilters: [
                        { 'topic._id': topicId },
                        { 'material._id': materialId },
                        { 'contrib.date': today }
                    ],
                    new: true
                });
                if (!updatedUser) {
                    // If no contribution exists for today, create one
                    const userWithNewContrib = await User_1.User.findOneAndUpdate({ firebaseUID }, {
                        $set: { [updatePath]: !isCurrentlyCompleted },
                        $push: {
                            contributions: {
                                date: today,
                                count: 0,
                                studyCount: studyCountChange > 0 ? 1 : 0
                            }
                        }
                    }, {
                        arrayFilters: [
                            { 'topic._id': topicId },
                            { 'material._id': materialId }
                        ],
                        new: true
                    });
                    return res.status(200).json(userWithNewContrib);
                }
                return res.status(200).json(updatedUser);
            }
        }
        return res.status(404).json({ message: 'Material not found' });
    }
    catch (error) {
        console.error('Error in completeMaterial:', error);
        res.status(500).json({ message: 'Error updating material status' });
    }
};
exports.completeMaterial = completeMaterial;
const uncompleteMaterial = async (req, res) => {
    try {
        const { firebaseUID, topicId, materialId } = req.params;
        const today = new Date().toISOString().split('T')[0];
        const user = await User_1.User.findOne({ firebaseUID });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const topic = user.topics.find(t => { var _a; return ((_a = t._id) === null || _a === void 0 ? void 0 : _a.toString()) === topicId; });
        if (!topic || !topic.categories) {
            return res.status(404).json({ error: 'Topic not found' });
        }
        const categoryTypes = ['webpage', 'video', 'podcast', 'book'];
        for (const type of categoryTypes) {
            const materials = topic.categories[type];
            if (!Array.isArray(materials))
                continue;
            const material = materials.find(m => { var _a; return ((_a = m._id) === null || _a === void 0 ? void 0 : _a.toString()) === materialId; });
            if (material) {
                // Update material completion status and decrement study count
                const updatePath = `topics.$[topic].categories.${type}.$[material].completed`;
                const updatedUser = await User_1.User.findOneAndUpdate({
                    firebaseUID,
                    'topics._id': topicId,
                    'contributions.date': today
                }, {
                    $set: { [updatePath]: false },
                    $inc: { 'contributions.$[contrib].studyCount': -1 }
                }, {
                    arrayFilters: [
                        { 'topic._id': topicId },
                        { 'material._id': materialId },
                        { 'contrib.date': today }
                    ],
                    new: true
                });
                if (!updatedUser) {
                    // If no contribution exists for today, create one with zero counts
                    const userWithNewContrib = await User_1.User.findOneAndUpdate({ firebaseUID }, {
                        $set: { [updatePath]: false },
                        $push: {
                            contributions: {
                                date: today,
                                count: 0,
                                studyCount: 0
                            }
                        }
                    }, {
                        arrayFilters: [
                            { 'topic._id': topicId },
                            { 'material._id': materialId }
                        ],
                        new: true
                    });
                    return res.status(200).json(userWithNewContrib);
                }
                // Ensure studyCount doesn't go below 0
                if (updatedUser.contributions) {
                    const todayContrib = updatedUser.contributions.find(c => c.date === today);
                    if (todayContrib && todayContrib.studyCount < 0) {
                        await User_1.User.findOneAndUpdate({
                            firebaseUID,
                            'contributions.date': today
                        }, {
                            $set: { 'contributions.$.studyCount': 0 }
                        });
                    }
                }
                return res.status(200).json(updatedUser);
            }
        }
        return res.status(404).json({ error: 'Material not found' });
    }
    catch (error) {
        console.error('Error in uncompleteMaterial:', error);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.uncompleteMaterial = uncompleteMaterial;
const updateTopic = async (req, res) => {
    var _a;
    try {
        const { topicId } = req.params;
        const { name } = req.body;
        const user = await User_1.User.findOne({ firebaseUID: (_a = req.user) === null || _a === void 0 ? void 0 : _a.uid });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const topic = user.topics.find(t => { var _a; return ((_a = t._id) === null || _a === void 0 ? void 0 : _a.toString()) === topicId; });
        if (!topic) {
            return res.status(404).json({ error: 'Topic not found' });
        }
        topic.name = name;
        await user.save();
        res.json(topic);
    }
    catch (error) {
        res.status(500).json({ error: 'Error updating topic' });
    }
};
exports.updateTopic = updateTopic;
const updateMaterialProgress = async (req, res) => {
    try {
        console.log('4. Controller received request:', {
            params: req.params,
            body: req.body
        });
        const { firebaseUID, topicId, materialId } = req.params;
        const { completedUnits, readingTime, totalUnits } = req.body;
        console.log('5. Finding user:', firebaseUID);
        const user = await User_1.User.findOne({ firebaseUID });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        console.log('6. Finding topic:', {
            topicId,
            foundUser: !!user,
            topicsCount: user.topics.length
        });
        const topic = user.topics.find(t => { var _a; return ((_a = t._id) === null || _a === void 0 ? void 0 : _a.toString()) === topicId; });
        if (!topic || !topic.categories) {
            return res.status(404).json({ error: 'Topic not found' });
        }
        console.log('7. Finding material:', {
            materialId,
            foundTopic: !!topic,
            categoriesExist: !!topic.categories
        });
        let materialFound = false;
        for (const type of ['webpage', 'video', 'podcast', 'book']) {
            const materials = topic.categories[type];
            if (!Array.isArray(materials))
                continue;
            console.log(`8. Checking ${type} materials:`, {
                materialsCount: materials.length,
                materialIds: materials.map(m => { var _a; return (_a = m._id) === null || _a === void 0 ? void 0 : _a.toString(); })
            });
            const materialIndex = materials.findIndex(m => { var _a; return ((_a = m._id) === null || _a === void 0 ? void 0 : _a.toString()) === materialId; });
            if (materialIndex !== -1) {
                materialFound = true;
                console.log('9. Material found:', {
                    type,
                    index: materialIndex,
                    currentMaterial: materials[materialIndex]
                });
                const progress = Math.min(Math.round((completedUnits / totalUnits) * 100), 100);
                const updatePath = `topics.$[topic].categories.${type}.$[material]`;
                const updatedUser = await User_1.User.findOneAndUpdate({ firebaseUID }, {
                    $set: {
                        [`${updatePath}.completedUnits`]: completedUnits,
                        [`${updatePath}.readingTime`]: readingTime,
                        [`${updatePath}.progress`]: progress
                    }
                }, {
                    arrayFilters: [
                        { 'topic._id': topicId },
                        { 'material._id': materialId }
                    ],
                    new: true
                });
                if (!updatedUser) {
                    return res.status(404).json({ error: 'Failed to update material' });
                }
                return res.json(updatedUser);
            }
        }
        if (!materialFound) {
            return res.status(404).json({ error: 'Material not found' });
        }
    }
    catch (error) {
        console.error('Error in updateMaterialProgress:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.updateMaterialProgress = updateMaterialProgress;
const updateExistingMaterials = async (req, res) => {
    try {
        const { firebaseUID } = req.params;
        const user = await User_1.User.findOne({ firebaseUID });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // 遍歷所有主題和材料
        const updatedUser = await User_1.User.findOneAndUpdate({ firebaseUID }, {
            $set: {
                'topics.$[].categories.webpage.$[].progress': 0,
                'topics.$[].categories.video.$[].progress': 0,
                'topics.$[].categories.podcast.$[].progress': 0,
                'topics.$[].categories.book.$[].progress': 0,
                'topics.$[].categories.webpage.$[].completedUnits': 0,
                'topics.$[].categories.video.$[].completedUnits': 0,
                'topics.$[].categories.podcast.$[].completedUnits': 0,
                'topics.$[].categories.book.$[].completedUnits': 0,
                'topics.$[].categories.webpage.$[].readingTime': 0,
                'topics.$[].categories.video.$[].readingTime': 0,
                'topics.$[].categories.podcast.$[].readingTime': 0,
                'topics.$[].categories.book.$[].readingTime': 0
            }
        }, { new: true });
        return res.json(updatedUser);
    }
    catch (error) {
        console.error('Error updating existing materials:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.updateExistingMaterials = updateExistingMaterials;
const deleteTopic = async (req, res) => {
    try {
        const { userId } = req.params;
        const { topicId } = req.params;
        const user = await User_1.User.findOneAndUpdate({ firebaseUID: userId }, { $pull: { topics: { _id: topicId } } }, { new: true });
        if (!user) {
            return res.status(404).json({ error: 'User or topic not found' });
        }
        res.status(200).json(user);
    }
    catch (error) {
        console.error('Error deleting topic:', error);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.deleteTopic = deleteTopic;
const deleteMaterial = async (req, res) => {
    try {
        const { userId } = req.params;
        const { topicId, materialId } = req.params;
        const user = await User_1.User.findOne({ firebaseUID: userId });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const topic = user.topics.find(t => { var _a; return ((_a = t._id) === null || _a === void 0 ? void 0 : _a.toString()) === topicId; });
        if (!topic || !topic.categories) {
            return res.status(404).json({ error: 'Topic not found' });
        }
        let materialDeleted = false;
        // 遍歷所有類別查找並刪除指定 ObjectId 的材料
        for (const type of ['webpage', 'video', 'podcast', 'book']) {
            const materials = topic.categories[type];
            if (!Array.isArray(materials))
                continue;
            const materialIndex = materials.findIndex(m => { var _a; return ((_a = m._id) === null || _a === void 0 ? void 0 : _a.toString()) === materialId; });
            if (materialIndex !== -1) {
                materials.splice(materialIndex, 1);
                materialDeleted = true;
                break;
            }
        }
        if (!materialDeleted) {
            return res.status(404).json({ error: 'Material not found' });
        }
        await user.save();
        return res.json(user);
    }
    catch (error) {
        console.error('Error deleting material:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.deleteMaterial = deleteMaterial;
