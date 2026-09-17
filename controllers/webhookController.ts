import { Request, Response } from 'express';
import SuccessResponse from '../utils/SuccessResponse';
import AppError from '../utils/AppError';
import asyncHandler from '../utils/asyncHandler';
import {
  createIdempotentBooking,
  BookingInput,
} from '../services/bookingService';

interface WebhookPayload {
  fullName?: unknown;
  name?: unknown;
  phone?: unknown;
  phoneNumber?: unknown;
  mobile?: unknown;
  email?: unknown;
  emailAddress?: unknown;
  serviceType?: unknown;
  service?: unknown;
  bookingType?: unknown;
  preferredDate?: unknown;
  date?: unknown;
  bookingDate?: unknown;
  preferredTime?: unknown;
  time?: unknown;
  bookingTime?: unknown;
  numberOfPeople?: unknown;
  people?: unknown;
  partySize?: unknown;
  guests?: unknown;
  notes?: unknown;
  specialRequests?: unknown;
  additionalNotes?: unknown;
  message?: unknown;
  reservationNumber?: unknown;
  bookingNumber?: unknown;
  reservationRef?: unknown;
  bookingRef?: unknown;
  reference?: unknown;
  idempotencyKey?: unknown;
  eventId?: unknown;
  messageId?: unknown;
  [key: string]: unknown;
}

const firstDefined = (...values: unknown[]): unknown =>
  values.find(
    (value) =>
      value !== undefined && value !== null && String(value).trim() !== '',
  );

const createBookingFromWebhook = asyncHandler(
  async (req: Request, res: Response) => {
    const body = (req.body ?? {}) as WebhookPayload;

    if (!body || Object.keys(body).length === 0) {
      throw new AppError('Empty webhook payload received', 400);
    }

    const input: BookingInput = {
      fullName: firstDefined(body.fullName, body.name),
      phone: firstDefined(body.phone, body.phoneNumber, body.mobile),
      email: firstDefined(body.email, body.emailAddress),
      serviceType: firstDefined(body.serviceType, body.service, body.bookingType),
      preferredDate: firstDefined(
        body.preferredDate,
        body.date,
        body.bookingDate,
      ),
      preferredTime: firstDefined(
        body.preferredTime,
        body.time,
        body.bookingTime,
      ),
      numberOfPeople: firstDefined(
        body.numberOfPeople,
        body.people,
        body.partySize,
        body.guests,
      ),
      notes: firstDefined(
        body.notes,
        body.specialRequests,
        body.additionalNotes,
        body.message,
      ),
      reservationNumber: firstDefined(
        body.reservationNumber,
        body.bookingNumber,
        body.reservationRef,
        body.bookingRef,
        body.reference,
      ),
    };

    const idempotencyKey = firstDefined(
      req.get('Idempotency-Key'),
      body.idempotencyKey,
      body.eventId,
      body.messageId,
    );

    const { booking, created, duplicate } = await createIdempotentBooking(
      input,
      {
        idempotencyKey:
          typeof idempotencyKey === 'string' ? idempotencyKey : undefined,
        source: 'ai-agent',
      },
    );

    return new SuccessResponse(
      res,
      duplicate
        ? 'Duplicate booking detected - existing booking returned'
        : 'Booking captured successfully',
      { ...booking.toObject(), duplicate },
      created ? 201 : 200,
    );
  },
);

export { createBookingFromWebhook };
