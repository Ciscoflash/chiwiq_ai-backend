import express from 'express';
import {
  getBookings,
  getBookingById,
  createBooking,
  updateBooking,
  updateBookingStatus,
  deleteBooking,
  getBookingStats,
} from '../controllers/bookingController';
import protect from '../middleware/auth';

const router = express.Router();

router.use(protect);

router.get('/stats', getBookingStats);

router.route('/')
  .get(getBookings)
  .post(createBooking);

router.route('/:id')
  .get(getBookingById)
  .put(updateBooking)
  .delete(deleteBooking);

router.put('/:id/status', updateBookingStatus);

export default router;