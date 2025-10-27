// backend/controllers/reviewController.js
import * as reviewService from '../services/reviewService.js';

// POST /api/reviews
export const addMyReview = async (req, res) => {
  try {
    // req.body에서 userId를 직접 받음
    const { resourceId, text, rating, userId } = req.body; 

    if (!resourceId || !text || !rating || !userId) {
      return res.status(400).json({ message: 'resourceId, text, rating, userId는 필수입니다.' });
    }
    
    const newReview = await reviewService.addReview(userId, resourceId, text, rating);
    res.status(201).json(newReview);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE /api/reviews/:id
export const removeMyReview = async (req, res) => {
  try {
    const { id: reviewId } = req.params; // 리뷰 문서의 _id
    
    // req.body에서 userId를 직접 받음 (소유권 확인용)
    const { userId } = req.body; 
    if (!userId) {
      return res.status(400).json({ message: 'userId가 필요합니다.' });
    }

    await reviewService.removeReview(userId, reviewId);
    res.status(200).json({ message: '리뷰가 삭제되었습니다.' });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

// GET /api/reviews/parking/:resourceId (인증 불필요)
export const getParkingReviews = async (req, res) => {
  try {
    const { resourceId } = req.params;
    const reviews = await reviewService.getReviewsByResourceId(resourceId);
    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};