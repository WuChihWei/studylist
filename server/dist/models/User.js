"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const materialSchema = new mongoose_1.default.Schema({
    type: {
        type: String,
        enum: ['webpage', 'book', 'video', 'podcast'],
        required: true
    },
    title: String,
    url: String,
    rating: Number,
    completed: {
        type: Boolean,
        default: false
    },
    dateAdded: {
        type: Date,
        default: Date.now
    }
});
const categorySchema = new mongoose_1.default.Schema({
    webpage: [materialSchema],
    video: [materialSchema],
    book: [materialSchema],
    podcast: [materialSchema]
});
const topicSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: true
    },
    categories: categorySchema,
    createdAt: {
        type: Date,
        default: Date.now
    }
});
const contributionSchema = new mongoose_1.default.Schema({
    date: {
        type: String,
        required: true
    },
    count: {
        type: Number,
        default: 0
    },
    studyCount: {
        type: Number,
        default: 0
    }
});
const userSchema = new mongoose_1.default.Schema({
    firebaseUID: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    bio: {
        type: String,
        default: "Introduce yourself"
    },
    isPremium: {
        type: Boolean,
        default: false
    },
    photoURL: {
        type: String
    },
    topics: [topicSchema],
    contributions: {
        type: [contributionSchema],
        default: []
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});
exports.User = mongoose_1.default.model('User', userSchema);
