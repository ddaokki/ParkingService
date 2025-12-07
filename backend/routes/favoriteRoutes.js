// backend/routes/favoriteRoutes.js
import express from 'express';
import * as favoriteController from '../controllers/favoriteController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// 특정 유저의 즐겨찾기 목록 조회 (JWT 필요)
router.get('/user/:userId', verifyToken, favoriteController.getMyFavorites);

// 즐겨찾기 추가 (JWT 필요)
router.post('/', verifyToken, favoriteController.addMyFavorite);

// 즐겨찾기 삭제 (JWT 필요)
router.delete('/:id', verifyToken, favoriteController.removeMyFavorite);

export default router;
