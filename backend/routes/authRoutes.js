// backend/routes/authRoutes.js
import express from 'express';
import * as authController from '../controllers/authController.js';

const router = express.Router();

// 회원가입
router.post('/register', authController.register);

// 로그인
router.post('/login', authController.login);

// 내 프로필 + 즐겨찾기 + 리뷰 조회 (URL에 userId 포함)
router.get('/profile/:userId', authController.getMyProfile);

export default router;