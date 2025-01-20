"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const userSchema = new mongoose_1.default.Schema({
    firebaseUID: {
        type: String,
        required: true,
        unique: true
    },
    name: String,
    email: String,
    materials: [{
            type: {
                type: String,
                enum: ['book', 'video', 'podcast']
            },
            title: String,
            rating: Number,
            dateAdded: Date
        }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});
exports.User = mongoose_1.default.model('User', userSchema);
