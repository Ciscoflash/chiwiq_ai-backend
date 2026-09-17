import crypto from 'crypto';

export const normalizeText = (value: unknown): string =>
  typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';

export const normalizeEmail = (value: unknown): string =>
  normalizeText(value).toLowerCase();

export const normalizePhone = (value: unknown): string =>
  normalizeText(value).replace(/\D/g, '');

const pad = (value: string, length: number): string =>
  value.padStart(length, '0');

export const normalizeDate = (value: unknown): string => {
  const raw = normalizeText(value);
  if (!raw) return raw;

  const iso = raw.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (iso) {
    return `${iso[1]}-${pad(iso[2], 2)}-${pad(iso[3], 2)}`;
  }

  const monthFirst = raw.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (monthFirst) {
    return `${monthFirst[3]}-${pad(monthFirst[1], 2)}-${pad(monthFirst[2], 2)}`;
  }

  return raw;
};

export const normalizeTime = (value: unknown): string => {
  const raw = normalizeText(value);
  if (!raw) return raw;

  const match = raw.toLowerCase().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
  if (!match) return raw;

  let hours = parseInt(match[1], 10);
  const minutes = match[2] ?? '00';
  const meridiem = match[3];

  if (meridiem === 'pm' && hours < 12) hours += 12;
  if (meridiem === 'am' && hours === 12) hours = 0;

  return `${pad(String(hours), 2)}:${minutes}`;
};

export interface FingerprintableBooking {
  fullName?: unknown;
  phone?: unknown;
  email?: unknown;
  serviceType?: unknown;
  preferredDate?: unknown;
  preferredTime?: unknown;
}

export const bookingFingerprint = (booking: FingerprintableBooking): string => {
  const parts = [
    normalizeText(booking.fullName).toLowerCase(),
    normalizePhone(booking.phone),
    normalizeEmail(booking.email),
    normalizeText(booking.serviceType).toLowerCase(),
    normalizeDate(booking.preferredDate),
    normalizeTime(booking.preferredTime),
  ];

  return crypto.createHash('sha256').update(parts.join('|')).digest('hex');
};
