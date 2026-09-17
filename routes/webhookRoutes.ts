import express from 'express';
import { createBookingFromWebhook } from '../controllers/webhookController';

const router = express.Router();

router.post('/booking', createBookingFromWebhook);

export default router;