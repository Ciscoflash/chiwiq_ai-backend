export interface SeedBookingInput {
  fullName: string;
  phone: string;
  email: string;
  serviceType: string;
  preferredDate: string;
  preferredTime: string;
  numberOfPeople: number;
  notes?: string;
  reservationNumber?: string;
  source: 'ai-agent' | 'admin' | 'manual';
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
}

const DAY = 24 * 60 * 60 * 1000;

function upcoming(daysFromNow: number): string {
  return new Date(Date.now() + daysFromNow * DAY).toISOString().slice(0, 10);
}

export const sampleBookings: SeedBookingInput[] = [
  {
    fullName: 'John Smith',
    phone: '+15551234567',
    email: 'john@example.com',
    serviceType: 'Haircut & Styling',
    preferredDate: upcoming(2),
    preferredTime: '14:30',
    numberOfPeople: 1,
    notes: 'Prefer a quieter time slot if possible.',
    reservationNumber: 'RSV-138276',
    source: 'ai-agent',
    status: 'pending',
  },
  {
    fullName: 'Maria Chen',
    phone: '+15559876543',
    email: 'maria@example.com',
    serviceType: 'Deep Tissue Massage',
    preferredDate: upcoming(3),
    preferredTime: '11:00',
    numberOfPeople: 1,
    notes: 'Shoulder and back focus, firm pressure.',
    reservationNumber: 'RSV-642390',
    source: 'ai-agent',
    status: 'confirmed',
  },
  {
    fullName: 'David Park',
    phone: '+14445551234',
    email: 'david@example.com',
    serviceType: 'Facial Treatment',
    preferredDate: upcoming(5),
    preferredTime: '16:00',
    numberOfPeople: 2,
    notes: 'Booked for myself and a friend as a gift.',
    reservationNumber: 'RSV-551748',
    source: 'ai-agent',
    status: 'pending',
  },
  {
    fullName: 'Sarah Johnson',
    phone: '+12025551234',
    email: 'sarah@example.com',
    serviceType: 'Full Body Waxing',
    preferredDate: upcoming(1),
    preferredTime: '09:30',
    numberOfPeople: 1,
    reservationNumber: 'RSV-917205',
    source: 'ai-agent',
    status: 'pending',
  },
  {
    fullName: 'James Wilson',
    phone: '+16505554444',
    email: 'james@example.com',
    serviceType: 'Hot Stone Therapy',
    preferredDate: upcoming(7),
    preferredTime: '09:00',
    numberOfPeople: 1,
    notes: 'Need early morning slot - have meetings after 11am.',
    reservationNumber: 'RSV-284613',
    source: 'ai-agent',
    status: 'confirmed',
  },
];