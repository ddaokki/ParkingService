// backend/services/reviewService.js
import Review from '../models/review.js';
import Parking from '../models/parking.js'; // 주차장 이름 조회를 위해 import
import mongoose from 'mongoose';

/**
 * 리뷰 추가
 */
export const addReview = async (userId, resourceId, text, rating) => {
  // 1. 주차장 정보 확인 (이름 가져오기)
  const parking = await Parking.findOne({ resourceId: resourceId });
  if (!parking) {
    throw new Error('존재하지 않는 주차장입니다.');
  }
  
  // (선택사항) 중복 리뷰 방지
  const existingReview = await Review.findOne({ user: userId, resourceId: resourceId });
  if (existingReview) {
    throw new Error('이미 이 주차장에 리뷰를 작성했습니다.');
  }

  // 2. 리뷰 생성
  const newReview = new Review({
    user: userId,
    resourceId: resourceId,
    parkingName: parking.name, // parking 모델의 name 필드
    text: text,
    rating: rating,
  });
  
  await newReview.save();
  return newReview;
};

/**
 * 리뷰 삭제
 */
export const removeReview = async (userId, reviewId) => {
  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    throw new Error('유효하지 않은 리뷰 ID입니다.');
  }
  
  const result = await Review.findOneAndDelete({ 
    _id: reviewId, 
    user: userId // 본인 리뷰만 삭제 가능
  });
  
  if (!result) {
    throw new Error('리뷰를 찾을 수 없거나 삭제 권한이 없습니다.');
  }
  return result;
};

/**
 * 특정 사용자가 쓴 리뷰 목록 조회
 * (요청사항: "유저가 남긴 리뷰(주차장 이름, 리뷰)")
 */
export const getReviewsByUserId = async (userId) => {
  // parkingName, text 필드를 Review 모델에 저장했으므로 간단히 조회 가능
  return Review.find({ user: userId })
    .select('resourceId parkingName text rating createdAt') // 필요한 필드만 선택
    .sort({ createdAt: -1 });
};

/**
 * (참고) 특정 주차장의 리뷰 목록 조회
 */
export const getReviewsByResourceId = async (resourceId) => {
  return Review.find({ resourceId: resourceId })
    .populate('user', 'username') // 작성자 정보 중 'username'만 가져오기 (수정됨)
    .sort({ createdAt: -1 });
};