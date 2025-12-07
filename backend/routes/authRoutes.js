// backend/routes/authRoutes.js
import express from 'express';
import * as authController from '../controllers/authController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// 회원가입 (공개)
router.post('/register', authController.register);

// 로그인 (공개)
router.post('/login', authController.login);

// 내 프로필 조회 (JWT 필요)
router.get('/profile/:userId', verifyToken, authController.getMyProfile);

export default router;
