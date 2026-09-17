import express from 'express';
import userRoutes from './userRoutes';
import bookingRoutes from './bookingRoutes';
import adminRoutes from './adminRoutes';
import webhookRoutes from './webhookRoutes';

const router = express.Router();

router.use('/users', userRoutes);
router.use('/bookings', bookingRoutes);
router.use('/admin', adminRoutes);
router.use('/webhook', webhookRoutes);

export default router;