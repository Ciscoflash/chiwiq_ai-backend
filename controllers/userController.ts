import { Request, Response } from 'express';
import User, { IUser } from '../models/User';
import SuccessResponse from '../utils/SuccessResponse';
import asyncHandler from '../utils/asyncHandler';
import AppError from '../utils/AppError';

export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const users = await User.find();
  return new SuccessResponse(res, 'Users fetched successfully', users);
});

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    throw new AppError(`User not found with id: ${req.params.id}`, 404);
  }
  return new SuccessResponse(res, 'User fetched successfully', user);
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.create(req.body);
  return new SuccessResponse(res, 'User created successfully', user, 201);
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  let user: IUser | null = await User.findById(req.params.id);
  if (!user) {
    throw new AppError(`User not found with id: ${req.params.id}`, 404);
  }

  user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  return new SuccessResponse(res, 'User updated successfully', user);
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    throw new AppError(`User not found with id: ${req.params.id}`, 404);
  }

  await user.deleteOne();
  return new SuccessResponse(res, 'User deleted successfully', null, 200);
});