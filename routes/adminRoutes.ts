import express from 'express';
import {
  login,
  register,
  getProfile,
  updateProfile,
  changePassword,
} from '../controllers/adminController';
import protect from '../middleware/auth';

const router = express.Router();

router.post('/login', login);
router.post('/register', register);

router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);

export default router;