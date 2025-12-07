// backend/controllers/favoriteController.js
import * as favoriteService from '../services/favoriteService.js';

// GET /api/favorites/user/:userId
export const getMyFavorites = async (req, res) => {
  try {
    const { userId } = req.params;
    const tokenUserId = req.user?.id;

    if (!tokenUserId) {
      return res.status(401).json({ message: '인증 정보가 없습니다.' });
    }

    // URL userId와 토큰 userId가 다르면 접근 불가
    if (userId && tokenUserId !== userId) {
      return res
        .status(403)
        .json({ message: '다른 사용자의 즐겨찾기에는 접근할 수 없습니다.' });
    }

    const favorites = await favoriteService.getFavoritesByUserId(tokenUserId);
    res.status(200).json(favorites);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/favorites
export const addMyFavorite = async (req, res) => {
  try {
    const tokenUserId = req.user?.id;
    if (!tokenUserId) {
      return res.status(401).json({ message: '인증 정보가 없습니다.' });
    }

    const { resourceId, resourceType } = req.body;

    if (!resourceId || !resourceType) {
      return res
        .status(400)
        .json({ message: 'resourceId, resourceType는 필수입니다.' });
    }

    const newFavorite = await favoriteService.addFavorite(
      tokenUserId,
      resourceId,
      resourceType
    );
    res.status(201).json(newFavorite);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE /api/favorites/:id
export const removeMyFavorite = async (req, res) => {
  try {
    const tokenUserId = req.user?.id;
    if (!tokenUserId) {
      return res.status(401).json({ message: '인증 정보가 없습니다.' });
    }

    const { id: favoriteId } = req.params; // 즐겨찾기 문서의 _id

    await favoriteService.removeFavorite(tokenUserId, favoriteId);
    res.status(200).json({ message: '즐겨찾기가 삭제되었습니다.' });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};
