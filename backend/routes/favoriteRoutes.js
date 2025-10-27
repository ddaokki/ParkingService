// backend/routes/favoriteRoutes.js
import express from 'express';
import * as favoriteController from '../controllers/favoriteController.js';

const router = express.Router();

// 특정 유저의 즐겨찾기 목록 조회
router.get('/user/:userId', favoriteController.getMyFavorites);

// 즐겨찾기 추가
router.post('/', favoriteController.addMyFavorite);

// 즐겨찾기 삭제 (body에 userId 필요)
router.delete('/:id', favoriteController.removeMyFavorite);

export default router;