"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.createUser = exports.getUserById = exports.getUsers = void 0;
const User_1 = __importDefault(require("../models/User"));
const SuccessResponse_1 = __importDefault(require("../utils/SuccessResponse"));
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler"));
const AppError_1 = __importDefault(require("../utils/AppError"));
exports.getUsers = (0, asyncHandler_1.default)(async (req, res) => {
    const users = await User_1.default.find();
    return new SuccessResponse_1.default(res, 'Users fetched successfully', users);
});
exports.getUserById = (0, asyncHandler_1.default)(async (req, res) => {
    const user = await User_1.default.findById(req.params.id);
    if (!user) {
        throw new AppError_1.default(`User not found with id: ${req.params.id}`, 404);
    }
    return new SuccessResponse_1.default(res, 'User fetched successfully', user);
});
exports.createUser = (0, asyncHandler_1.default)(async (req, res) => {
    const user = await User_1.default.create(req.body);
    return new SuccessResponse_1.default(res, 'User created successfully', user, 201);
});
exports.updateUser = (0, asyncHandler_1.default)(async (req, res) => {
    let user = await User_1.default.findById(req.params.id);
    if (!user) {
        throw new AppError_1.default(`User not found with id: ${req.params.id}`, 404);
    }
    user = await User_1.default.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });
    return new SuccessResponse_1.default(res, 'User updated successfully', user);
});
exports.deleteUser = (0, asyncHandler_1.default)(async (req, res) => {
    const user = await User_1.default.findById(req.params.id);
    if (!user) {
        throw new AppError_1.default(`User not found with id: ${req.params.id}`, 404);
    }
    await user.deleteOne();
    return new SuccessResponse_1.default(res, 'User deleted successfully', null, 200);
});
//# sourceMappingURL=userController.js.map