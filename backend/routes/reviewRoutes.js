// backend/routes/reviewRoutes.js
import express from 'express';
import * as reviewController from '../controllers/reviewController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// 특정 주차장의 리뷰 목록 보기 (인증 불필요)
router.get('/parking/:resourceId', reviewController.getParkingReviews);

// 특정 EV 충전소의 리뷰 목록 보기 (인증 불필요)
router.get('/evcharger/:resourceId', reviewController.getEvChargerReviews);

// 리뷰 작성 (JWT 필요)
router.post('/', verifyToken, reviewController.addMyReview);

// 리뷰 삭제 (JWT 필요)
router.delete('/:id', verifyToken, reviewController.removeMyReview);

export default router;
