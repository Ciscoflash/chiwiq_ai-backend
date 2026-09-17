import { Request, Response } from 'express';
import Booking from '../models/Booking';
import SuccessResponse from '../utils/SuccessResponse';
import asyncHandler from '../utils/asyncHandler';
import AppError from '../utils/AppError';
import { QueryFilters, buildFilters } from '../utils/queryFilters';

export const getBookings = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as QueryFilters;
  const page = Math.max(parseInt(String(query.page || '1'), 10), 1);
  const limit = Math.min(
    Math.max(parseInt(String(query.limit || '50'), 10), 1),
    100
  );
  const skip = (page - 1) * limit;

  const filters = buildFilters(query);

  const [bookings, total] = await Promise.all([
    Booking.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Booking.countDocuments(filters),
  ]);

  const totalPages = Math.ceil(total / limit);

  return new SuccessResponse(res, 'Bookings fetched successfully', {
    items: bookings,
    meta: {
      total,
      page,
      limit,
      totalPages,
    },
  } as never);
});

export const getBookingById = asyncHandler(async (req: Request, res: Response) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    throw new AppError(`Booking not found with id: ${req.params.id}`, 404);
  }

  return new SuccessResponse(res, 'Booking fetched successfully', booking);
});

export const createBooking = asyncHandler(async (req: Request, res: Response) => {
  const booking = await Booking.create({
    ...req.body,
    source: req.body.source || 'admin',
  });

  return new SuccessResponse(res, 'Booking created successfully', booking, 201);
});

export const updateBooking = asyncHandler(async (req: Request, res: Response) => {
  let booking = await Booking.findById(req.params.id);

  if (!booking) {
    throw new AppError(`Booking not found with id: ${req.params.id}`, 404);
  }

  booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  return new SuccessResponse(res, 'Booking updated successfully', booking);
});

export const updateBookingStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { status } = req.body;

    if (!status) {
      throw new AppError('Status is required', 400);
    }

    const allowedStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!allowedStatuses.includes(status)) {
      throw new AppError(
        `Invalid status. Must be one of: ${allowedStatuses.join(', ')}`,
        400
      );
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      throw new AppError(`Booking not found with id: ${req.params.id}`, 404);
    }

    booking.status = status;
    await booking.save();

    return new SuccessResponse(res, 'Booking status updated successfully', booking);
  }
);

export const deleteBooking = asyncHandler(async (req: Request, res: Response) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    throw new AppError(`Booking not found with id: ${req.params.id}`, 404);
  }

  await booking.deleteOne();

  return new SuccessResponse(res, 'Booking deleted successfully', null);
});

export const getBookingStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await Booking.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  const total = await Booking.countDocuments({});
  const latest = await Booking.find({}).sort({ createdAt: -1 }).limit(5);

  const statsMap = stats.reduce<Record<string, number>>((acc, item) => {
    acc[item._id] = item.count;
    return acc;
  }, {});

  return new SuccessResponse(res, 'Booking stats fetched successfully', {
    statsMap,
    total,
    latest,
  } as never);
});