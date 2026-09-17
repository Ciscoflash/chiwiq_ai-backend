import { Request, Response } from 'express';
import Admin from '../models/Admin';
import SuccessResponse from '../utils/SuccessResponse';
import asyncHandler from '../utils/asyncHandler';
import AppError from '../utils/AppError';
import { signToken } from '../utils/token';
import { AuthRequest } from '../middleware/auth';

interface LoginBody {
  email?: string;
  password?: string;
}

interface RegisterBody {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
}

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = (req.body || {}) as LoginBody;

  if (!email || !password) {
    throw new AppError('Please provide an email and password', 400);
  }

  const admin = await Admin.findOne({ email: email.toLowerCase() }).select(
    '+password'
  );

  if (!admin) {
    throw new AppError('Invalid email or password', 401);
  }

  const isMatch = await admin.matchPassword(password);

  if (!isMatch) {
    throw new AppError('Invalid email or password', 401);
  }

  const payload = {
    id: admin._id.toString(),
    email: admin.email,
    role: admin.role,
  };

  const token = signToken(payload);

  return new SuccessResponse(res, 'Login successful', {
    token,
    admin: { ...payload, name: admin.name },
  } as never);
});

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, role } = (req.body || {}) as RegisterBody;

  if (!name || !email || !password) {
    throw new AppError('Please provide name, email and password', 400);
  }

  const exists = await Admin.findOne({ email: email.toLowerCase() });

  if (exists) {
    throw new AppError('An admin with this email already exists', 409);
  }

  const admin = await Admin.create({
    name,
    email,
    password,
    role: role || 'admin',
  });

  const token = signToken({
    id: admin._id.toString(),
    email: admin.email,
    role: admin.role,
  });

  return new SuccessResponse(
    res,
    'Admin created successfully',
    {
      token,
      admin: {
        id: admin._id.toString(),
        email: admin.email,
        role: admin.role,
        name: admin.name,
      },
    } as never,
    201
  );
});

export const getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const admin = await Admin.findById(req.admin?.id).select('-password');

  if (!admin) {
    throw new AppError('Admin not found', 404);
  }

  return new SuccessResponse(res, 'Profile fetched successfully', admin);
});

export const updateProfile = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { name, avatar } = req.body;

    const admin = await Admin.findById(req.admin?.id);

    if (!admin) {
      throw new AppError('Admin not found', 404);
    }

    if (name) admin.name = name;
    if (avatar !== undefined) admin.avatar = avatar;

    await admin.save();

    return new SuccessResponse(res, 'Profile updated successfully', {
      id: admin._id.toString(),
      name: admin.name,
      email: admin.email,
      role: admin.role,
      avatar: admin.avatar,
    } as never);
  }
);

export const changePassword = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new AppError(
        'Please provide current password and new password',
        400
      );
    }

    if (newPassword.length < 6) {
      throw new AppError('New password must be at least 6 characters', 400);
    }

    const admin = await Admin.findById(req.admin?.id).select('+password');

    if (!admin) {
      throw new AppError('Admin not found', 404);
    }

    const isMatch = await admin.matchPassword(currentPassword);

    if (!isMatch) {
      throw new AppError('Current password is incorrect', 401);
    }

    admin.password = newPassword;
    await admin.save();

    return new SuccessResponse(res, 'Password changed successfully');
  }
);