// backend/controllers/favoriteController.js
import * as favoriteService from '../services/favoriteService.js';

// GET /api/favorites/user/:userId
export const getMyFavorites = async (req, res) => {
  try {
    // URL 파라미터에서 userId 받음
    const { userId } = req.params; 
    const favorites = await favoriteService.getFavoritesByUserId(userId);
    res.status(200).json(favorites);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/favorites
export const addMyFavorite = async (req, res) => {
  try {
    // req.body에서 userId를 직접 받음
    const { resourceId, resourceType, userId } = req.body; 

    if (!resourceId || !resourceType || !userId) {
      return res.status(400).json({ message: 'resourceId, resourceType, userId는 필수입니다.' });
    }
    
    const newFavorite = await favoriteService.addFavorite(userId, resourceId, resourceType);
    res.status(201).json(newFavorite);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE /api/favorites/:id
export const removeMyFavorite = async (req, res) => {
  try {
    const { id: favoriteId } = req.params; // 즐겨찾기 문서의 _id
    
    // req.body에서 userId를 직접 받음 (소유권 확인용)
    const { userId } = req.body; 
    if (!userId) {
      return res.status(400).json({ message: 'userId가 필요합니다.' });
    }

    await favoriteService.removeFavorite(userId, favoriteId);
    res.status(200).json({ message: '즐겨찾기가 삭제되었습니다.' });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};