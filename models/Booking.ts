import mongoose, { Schema, Document, InferSchemaType } from 'mongoose';
import crypto from 'crypto';
import { bookingFingerprint } from '../utils/bookingFingerprint';

const RESERVATION_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const generateReservationNumber = (): string => {
  const chars = Array.from(
    { length: 6 },
    () => RESERVATION_ALPHABET[crypto.randomInt(RESERVATION_ALPHABET.length)]
  );
  return `CHQ-${chars.join('')}`;
};

export const bookingSchema = new Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Customer full name is required'],
      trim: true,
      maxlength: [100, 'Name cannot be more than 100 characters'],
    },
    reservationNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      trim: true,
      lowercase: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email'],
    },
    serviceType: {
      type: String,
      required: [true, 'Service or booking type is required'],
      trim: true,
      maxlength: [100, 'Service type cannot be more than 100 characters'],
    },
    preferredDate: {
      type: String,
      required: [true, 'Preferred date is required'],
    },
    preferredTime: {
      type: String,
      required: [true, 'Preferred time is required'],
    },
    numberOfPeople: {
      type: Number,
      default: 1,
      min: [1, 'At least 1 person is required'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [2000, 'Notes cannot be more than 2000 characters'],
    },
    source: {
      type: String,
      enum: ['ai-agent', 'admin', 'manual'],
      default: 'ai-agent',
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    dedupKey: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.dedupKey;
        delete ret.idempotencyKey;
        return ret;
      },
    },
    toObject: {
      transform: (_doc, ret) => {
        delete ret.dedupKey;
        delete ret.idempotencyKey;
        return ret;
      },
    },
  }
);

export type BookingSchemaType = InferSchemaType<typeof bookingSchema>;

bookingSchema.pre('save', async function (next) {
  if (!this.reservationNumber) {
    this.reservationNumber = generateReservationNumber();
  }

  if (this.status !== 'cancelled') {
    this.dedupKey = bookingFingerprint({
      fullName: this.fullName,
      phone: this.phone,
      email: this.email,
      serviceType: this.serviceType,
      preferredDate: this.preferredDate,
      preferredTime: this.preferredTime,
    });
  }

  next();
});

export interface IBooking extends Document, BookingSchemaType {}

const Booking = mongoose.model<IBooking>('Booking', bookingSchema);

export default Booking;