import mongoose from 'mongoose';
import Booking, { IBooking } from '../models/Booking';
import AppError from '../utils/AppError';
import {
  bookingFingerprint,
  normalizeDate,
  normalizeEmail,
  normalizePhone,
  normalizeText,
  normalizeTime,
} from '../utils/bookingFingerprint';

export type BookingSource = 'ai-agent' | 'admin' | 'manual';

export interface BookingInput {
  fullName?: unknown;
  phone?: unknown;
  email?: unknown;
  serviceType?: unknown;
  preferredDate?: unknown;
  preferredTime?: unknown;
  numberOfPeople?: unknown;
  notes?: unknown;
  reservationNumber?: unknown;
}

export interface NormalizedBookingInput {
  fullName: string;
  phone: string;
  email: string;
  serviceType: string;
  preferredDate: string;
  preferredTime: string;
  numberOfPeople: number;
  notes: string;
  reservationNumber: string;
}

export interface NormalizeResult {
  values: NormalizedBookingInput;
  errors: Record<string, string>;
}

export interface CreateBookingOptions {
  idempotencyKey?: string;
  source?: BookingSource;
}

export interface CreateBookingResult {
  booking: IBooking;
  created: boolean;
  duplicate: boolean;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_IDEMPOTENCY_KEY_LENGTH = 200;

export const normalizeBooking = (input: BookingInput): NormalizeResult => {
  const errors: Record<string, string> = {};

  const fullName = normalizeText(input.fullName);
  if (!fullName) {
    errors.fullName = 'Customer full name is required';
  } else if (fullName.length > 100) {
    errors.fullName = 'Name cannot be more than 100 characters';
  }

  const phoneRaw = normalizeText(input.phone);
  const phoneDigits = normalizePhone(input.phone);
  if (!phoneRaw) {
    errors.phone = 'Phone number is required';
  } else if (phoneDigits.length < 7 || phoneDigits.length > 15) {
    errors.phone = 'Please provide a valid phone number';
  }

  const email = normalizeEmail(input.email);
  if (!email) {
    errors.email = 'Email address is required';
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = 'Please provide a valid email address';
  }

  const serviceType = normalizeText(input.serviceType);
  if (!serviceType) {
    errors.serviceType = 'Service or booking type is required';
  } else if (serviceType.length > 100) {
    errors.serviceType = 'Service type cannot be more than 100 characters';
  }

  const preferredDate = normalizeDate(input.preferredDate);
  if (!preferredDate) {
    errors.preferredDate = 'Preferred date is required';
  } else {
    const iso = preferredDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (iso) {
      const parsed = new Date(`${preferredDate}T00:00:00.000Z`);
      if (
        Number.isNaN(parsed.getTime()) ||
        parsed.toISOString().slice(0, 10) !== preferredDate
      ) {
        errors.preferredDate = `Preferred date "${preferredDate}" is not a valid calendar date`;
      }
    }
  }

  const preferredTime = normalizeTime(input.preferredTime);
  if (!preferredTime) {
    errors.preferredTime = 'Preferred time is required';
  } else {
    const clock = preferredTime.match(/^(\d{2}):(\d{2})$/);
    if (clock) {
      const hours = parseInt(clock[1], 10);
      const minutes = parseInt(clock[2], 10);
      if (hours > 23 || minutes > 59) {
        errors.preferredTime = `Preferred time "${preferredTime}" is not a valid time`;
      }
    }
  }

  let numberOfPeople = 1;
  if (
    input.numberOfPeople !== undefined &&
    input.numberOfPeople !== null &&
    String(input.numberOfPeople).trim() !== ''
  ) {
    const parsedPeople =
      typeof input.numberOfPeople === 'number'
        ? input.numberOfPeople
        : Number(input.numberOfPeople);

    if (!Number.isInteger(parsedPeople) || parsedPeople < 1) {
      errors.numberOfPeople =
        'Number of people must be a whole number of 1 or more';
    } else {
      numberOfPeople = parsedPeople;
    }
  }

  const notes = normalizeText(input.notes);
  if (notes.length > 2000) {
    errors.notes = 'Notes cannot be more than 2000 characters';
  }

  const reservationNumber = normalizeText(input.reservationNumber);

  return {
    values: {
      fullName,
      phone: phoneRaw,
      email,
      serviceType,
      preferredDate,
      preferredTime,
      numberOfPeople,
      notes,
      reservationNumber,
    },
    errors,
  };
};

const sanitizeIdempotencyKey = (value?: string): string | undefined => {
  if (value === undefined || value === null) return undefined;

  const key = String(value).trim();
  if (!key) return undefined;

  if (key.length > MAX_IDEMPOTENCY_KEY_LENGTH) {
    throw new AppError(
      'Idempotency key is too long',
      400,
      { idempotencyKey: `Idempotency key must be ${MAX_IDEMPOTENCY_KEY_LENGTH} characters or fewer` },
    );
  }

  return key;
};

interface DuplicateKeyError {
  code: number;
  keyValue?: Record<string, unknown>;
}

const isDuplicateKeyError = (error: unknown): error is DuplicateKeyError =>
  typeof error === 'object' &&
  error !== null &&
  (error as { code?: number }).code === 11000;

const validationDetails = (
  error: mongoose.Error.ValidationError,
): Record<string, string> => {
  const details: Record<string, string> = {};
  for (const [field, value] of Object.entries(error.errors)) {
    details[field] = value.message;
  }
  return details;
};

interface FailureContext {
  values: NormalizedBookingInput;
  dedupKey: string;
  idempotencyKey?: string;
  source: BookingSource;
}

const recoverFromFailure = async (
  error: unknown,
  context: FailureContext,
): Promise<CreateBookingResult> => {
  if (error instanceof AppError) {
    throw error;
  }

  if (error instanceof mongoose.Error.ValidationError) {
    throw new AppError(
      'Booking details are incomplete or invalid',
      400,
      validationDetails(error),
    );
  }

  if (isDuplicateKeyError(error)) {
    const conflictingKeys = Object.keys(error.keyValue ?? {});

    if (
      context.idempotencyKey &&
      conflictingKeys.includes('idempotencyKey')
    ) {
      const replay = await Booking.findOne({
        idempotencyKey: context.idempotencyKey,
      });
      if (replay) {
        return { booking: replay, created: false, duplicate: true };
      }
    }

    if (conflictingKeys.includes('reservationNumber')) {
      throw new AppError('This reservation number is already in use', 409, {
        reservationNumber: 'This reservation number is already in use',
      });
    }

    const active = await Booking.findOne({
      dedupKey: context.dedupKey,
      status: { $ne: 'cancelled' },
    });
    if (active) {
      return { booking: active, created: false, duplicate: true };
    }

    const cancelled = await Booking.findOne({ dedupKey: context.dedupKey });
    if (cancelled) {
      const resurrected = await Booking.findByIdAndUpdate(
        cancelled._id,
        {
          $set: {
            ...context.values,
            reservationNumber:
              context.values.reservationNumber ||
              cancelled.reservationNumber,
            dedupKey: context.dedupKey,
            idempotencyKey:
              context.idempotencyKey ?? cancelled.idempotencyKey,
            source: context.source,
            status: 'pending',
          },
        },
        { new: true, runValidators: true },
      );

      if (resurrected) {
        return { booking: resurrected, created: true, duplicate: false };
      }
    }

    throw new AppError(
      'A matching booking already exists',
      409,
      { booking: 'A matching booking already exists' },
    );
  }

  console.error('[booking] unexpected failure while creating booking:', error);
  throw new AppError(
    'Unable to process the booking right now. Please try again.',
    500,
  );
};

export const createIdempotentBooking = async (
  input: BookingInput,
  options: CreateBookingOptions = {},
): Promise<CreateBookingResult> => {
  const { values, errors } = normalizeBooking(input);

  if (Object.keys(errors).length > 0) {
    throw new AppError(
      'Booking details are incomplete or invalid',
      400,
      errors,
    );
  }

  const idempotencyKey = sanitizeIdempotencyKey(options.idempotencyKey);
  const source = options.source ?? 'ai-agent';
  const dedupKey = bookingFingerprint(values);

  try {
    if (idempotencyKey) {
      const replay = await Booking.findOne({ idempotencyKey });
      if (replay) {
        return { booking: replay, created: false, duplicate: true };
      }
    }

    const existing = await Booking.findOne({
      dedupKey,
      status: { $ne: 'cancelled' },
    });

    if (existing) {
      return { booking: existing, created: false, duplicate: true };
    }

    const booking = await Booking.create({
      ...values,
      reservationNumber: values.reservationNumber || undefined,
      dedupKey,
      idempotencyKey,
      source,
      status: 'pending',
    });

    return { booking, created: true, duplicate: false };
  } catch (error) {
    return recoverFromFailure(error, {
      values,
      dedupKey,
      idempotencyKey,
      source,
    });
  }
};
