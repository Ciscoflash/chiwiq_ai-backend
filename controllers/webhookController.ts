import { Request, Response } from 'express';
import Booking from '../models/Booking';
import SuccessResponse from '../utils/SuccessResponse';
import AppError from '../utils/AppError';
import asyncHandler from '../utils/asyncHandler';

interface WebhookPayload {
  fullName?: string;
  name?: string;
  phone?: string;
  email?: string;
  serviceType?: string;
  service?: string;
  bookingType?: string;
  preferredDate?: string;
  date?: string;
  preferredTime?: string;
  time?: string;
  numberOfPeople?: number;
  people?: number;
  notes?: string;
  specialRequests?: string;
  additionalNotes?: string;
  reservationNumber?: string;
  bookingNumber?: string;
  reservationRef?: string;
  bookingRef?: string;
  reference?: string;
  [key: string]: unknown;
}

const pick = (value: string | undefined, fallback: string): string =>
  value !== undefined && String(value).trim() !== '' ? String(value).trim() : fallback;

const createBookingFromWebhook = asyncHandler(
  async (req: Request, res: Response) => {
    const body = req.body as WebhookPayload;

  if (!body || Object.keys(body).length === 0) {
    throw new AppError('Empty webhook payload received', 400);
  }

  const fullName = pick(body.fullName ?? body.name, '');
  const phone = pick(body.phone, '');
  const email = pick(body.email, '').toLowerCase();
  const serviceType = pick(body.serviceType ?? body.service ?? body.bookingType, '');
  const preferredDate = pick(body.preferredDate ?? body.date, '');
  const preferredTime = pick(body.preferredTime ?? body.time, '');
  const notes = pick(
    body.notes ?? body.specialRequests ?? body.additionalNotes,
    ''
  );
  const numberOfPeople =
    typeof body.numberOfPeople === 'number'
      ? body.numberOfPeople
      : typeof body.people === 'number'
        ? body.people
        : body.numberOfPeople
          ? Number(body.numberOfPeople)
          : body.people
            ? Number(body.people)
            : 1;
  const reservationNumber = pick(
    body.reservationNumber ?? body.bookingNumber ?? body.reservationRef ?? body.bookingRef ?? body.reference,
    ''
  );

  try {
    const booking = await Booking.create({
      fullName,
      phone,
      email,
      serviceType,
      preferredDate,
      preferredTime,
      numberOfPeople: Number.isFinite(numberOfPeople) && numberOfPeople > 0 ? numberOfPeople : 1,
      notes,
      reservationNumber: reservationNumber || undefined,
      source: 'ai-agent',
      status: 'pending',
    });

    return new SuccessResponse(
      res,
      'Booking captured successfully',
      booking,
      201
    );
  } catch (error) {
    const err = error as Error & { name?: string; message?: string };
    throw new AppError(`Failed to capture booking: ${err.message}`, 500);
  }
  }
);

export { createBookingFromWebhook };