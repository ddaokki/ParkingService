// backend/routes/reviewRoutes.js
import express from 'express';
import * as reviewController from '../controllers/reviewController.js';

const router = express.Router();

// 특정 주차장의 리뷰 목록 보기 (인증 불필요)
router.get('/parking/:resourceId', reviewController.getParkingReviews);

// 리뷰 작성 (body에 userId 필요)
router.post('/', reviewController.addMyReview);

// 리뷰 삭제 (body에 userId 필요)
router.delete('/:id', reviewController.removeMyReview);

export default router;