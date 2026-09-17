import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db';
import Admin from '../models/Admin';
import Booking, { generateReservationNumber } from '../models/Booking';
import { bookingFingerprint } from '../utils/bookingFingerprint';
import { sampleBookings, type SeedBookingInput } from './data/bookings';

dotenv.config();

const reset = process.argv.includes('--reset');

const ADMIN_EMAIL = 'admin@chiwiq.com';
const ADMIN_PASSWORD = 'password123';
const ADMIN_NAME = 'Chiwiq Admin';

async function seedAdmin(): Promise<void> {
  const existing = await Admin.findOne({ email: ADMIN_EMAIL });

  if (!existing) {
    await Admin.create({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: 'admin',
    });
    console.log(`\u2713 Admin created: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
    return;
  }

  if (reset || !existing.name) {
    existing.name = ADMIN_NAME;
    existing.avatar = '';
    await existing.save();
  }
  console.log(`\u2713 Admin already exists: ${ADMIN_EMAIL} (id: ${existing._id})`);
}

async function seedBookings(): Promise<void> {
  const count = await Booking.countDocuments();

  if (reset) {
    await Booking.deleteMany({});
    console.log('  \u2192 Wiped existing bookings (--reset)');
  }

  if (count > 0 && !reset) {
    console.log(`\u2713 ${count} bookings already present, skipping sample bookings`);
    return;
  }

  const docs: SeedBookingInput[] = [...sampleBookings];
  const seeded = await Booking.insertMany(docs);
  console.log(`\u2713 Seeded ${seeded.length} sample bookings`);
}

async function backfillReservationNumbers(): Promise<void> {
  const missing = await Booking.find({
    $or: [
      { reservationNumber: { $exists: false } },
      { reservationNumber: '' },
    ],
  });

  if (missing.length === 0) {
    console.log('\u2713 All bookings already have reservation numbers');
    return;
  }

  for (const booking of missing) {
    booking.reservationNumber = generateReservationNumber();
    await booking.save();
  }
  console.log(`\u2713 Assigned reservation numbers to ${missing.length} booking(s)`);
}

async function backfillDedupKeys(): Promise<void> {
  const missing = await Booking.find({
    $or: [{ dedupKey: { $exists: false } }, { dedupKey: '' }],
    status: { $ne: 'cancelled' },
  });

  if (missing.length === 0) {
    console.log('\u2713 All bookings already have fingerprint keys');
    return;
  }

  const seen = new Set<string>();
  let assigned = 0;

  for (const booking of missing) {
    const fingerprint = bookingFingerprint({
      fullName: booking.fullName,
      phone: booking.phone,
      email: booking.email,
      serviceType: booking.serviceType,
      preferredDate: booking.preferredDate,
      preferredTime: booking.preferredTime,
    });

    if (seen.has(fingerprint)) {
      console.log(
        `  \u2192 Skipped legacy duplicate booking ${booking._id} (kept without fingerprint)`,
      );
      continue;
    }

    try {
      booking.dedupKey = fingerprint;
      await booking.save();
      seen.add(fingerprint);
      assigned += 1;
    } catch (error) {
      const code = (error as { code?: number }).code;
      if (code !== 11000) throw error;
      console.log(
        `  \u2192 Skipped legacy duplicate booking ${booking._id} (fingerprint already taken)`,
      );
    }
  }

  console.log(`\u2713 Assigned fingerprint keys to ${assigned} booking(s)`);
}

async function main(): Promise<void> {
  await connectDB();
  console.log('Seeding Chiwiq database...\n');

  await seedAdmin();
  await seedBookings();
  await backfillReservationNumbers();
  await backfillDedupKeys();

  console.log('\nSeeding complete.');

  const adminCount = await Admin.countDocuments();
  const bookingCount = await Booking.countDocuments();
  console.log(`Total admins: ${adminCount} | Total bookings: ${bookingCount}`);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(async (error) => {
  console.error('Seeding failed:', error);
  await mongoose.disconnect();
  process.exit(1);
});