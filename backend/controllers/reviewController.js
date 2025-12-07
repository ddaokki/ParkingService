// backend/controllers/reviewController.js
import * as reviewService from '../services/reviewService.js';

// POST /api/reviews
export const addMyReview = async (req, res) => {
  try {
    const tokenUserId = req.user?.id;
    if (!tokenUserId) {
      return res.status(401).json({ message: '인증 정보가 없습니다.' });
    }

    const { resourceId, resourceType, text, rating } = req.body;

    if (!resourceId || !resourceType || !text || !rating) {
      return res.status(400).json({
        message: 'resourceId, resourceType, text, rating는 필수입니다.',
      });
    }

    const newReview = await reviewService.addReview(
      tokenUserId,
      resourceId,
      text,
      rating,
      resourceType
    );
    res.status(201).json(newReview);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE /api/reviews/:id
export const removeMyReview = async (req, res) => {
  try {
    const tokenUserId = req.user?.id;
    if (!tokenUserId) {
      return res.status(401).json({ message: '인증 정보가 없습니다.' });
    }

    const { id: reviewId } = req.params; // 리뷰 문서의 _id

    await reviewService.removeReview(tokenUserId, reviewId);
    res.status(200).json({ message: '리뷰가 삭제되었습니다.' });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

// GET /api/reviews/parking/:resourceId (인증 불필요)
export const getParkingReviews = async (req, res) => {
  try {
    const { resourceId } = req.params;
    const reviews = await reviewService.getReviewsByResourceId(
      resourceId,
      'parking'
    );
    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/reviews/evcharger/:resourceId (인증 불필요)
export const getEvChargerReviews = async (req, res) => {
  try {
    const { resourceId } = req.params;
    const reviews = await reviewService.getReviewsByResourceId(
      resourceId,
      'ev_charger'
    );
    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
