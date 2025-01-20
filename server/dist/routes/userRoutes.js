"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const router = (0, express_1.Router)();
// Define your routes
router.get('/:firebaseUID', userController_1.getUserByFirebaseUID);
exports.default = router;
