// backend/services/reviewService.js
import Review from '../models/review.js';
import Parking from '../models/parking.js'; // 주차장 이름 조회를 위해 import
import EvCharger from '../models/evCharger.js';
import mongoose from 'mongoose';

/**
 * 리뷰 추가 (parking, evcharger 공용)
 */
export const addReview = async (userId, resourceId, text, rating, resourceType) => {
  let resourceName;
  let resourceToReview; // ⭐️ 이 변수명을 사용합니다.

  // 1. 리소스 타입에 따라 적절한 모델에서 리소스 조회
  if (resourceType === 'parking') {
    resourceToReview = await Parking.findOne({ resourceId: resourceId });
    if (!resourceToReview) {
      throw new Error('존재하지 않는 주차장입니다.');
    }
    resourceName = resourceToReview.name;
    
    // [방어 코드] 주차장 이름이 DB에 없는 경우
    if (!resourceName) {
      throw new Error('해당 주차장의 이름(name) 정보가 DB에 존재하지 않아 리뷰를 작성할 수 없습니다.');
    }

  } else if (resourceType === 'ev_charger') {
    // [수정] EV Charger의 resourceId는 Number 타입이므로 변환
    const numericResourceId = Number(resourceId);
    if (isNaN(numericResourceId)) {
      throw new Error('유효하지 않은 EV Charger resourceId입니다.');
    }
    
    resourceToReview = await EvCharger.findOne({ resourceId: numericResourceId });
    if (!resourceToReview) {
      throw new Error('존재하지 않는 EV 충전소입니다.');
    }
    resourceName = resourceToReview.charging_station;
    
    // [방어 코드] 충전소 이름이 DB에 없는 경우
    if (!resourceName) {
      throw new Error('해당 충전소의 이름(charging_station) 정보가 DB에 존재하지 않아 리뷰를 작성할 수 없습니다.');
    }

  } else {
    throw new Error('유효하지 않은 리소스 타입입니다.');
  }

  // // 1. 주차장 정보 확인 (이름 가져오기)
  // const parking = await Parking.findOne({ resourceId: resourceId });
  // if (!parking) {
  //   throw new Error('존재하지 않는 주차장입니다.');
  // }
  
  // (선택사항) 중복 리뷰 방지
  const existingReview = await Review.findOne({ user: userId, resourceId: resourceId });
  if (existingReview) {
    throw new Error('이미 이 리소스에 리뷰를 작성했습니다.');
  }

  // 2. 리뷰 생성
  const newReview = new Review({
    user: userId,
    resourceId: resourceId,
    resourceType: resourceType,
    resourceName: resourceName, // ⭐️ 이제 이 값은 절대 비어있지 않음
    text: text,
    rating: rating,
  });
  
  await newReview.save();
  return newReview;
};

// 리뷰 삭제
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

 //특정 사용자가 쓴 리뷰 목록 조회
 //(요청사항: "유저가 남긴 리뷰(주차장 이름, 리뷰)")
 
export const getReviewsByUserId = async (userId) => {
  // parkingName, text 필드를 Review 모델에 저장했으므로 간단히 조회 가능
  return Review.find({ user: userId })
    .select('resourceId resourceName text rating createdAt') // [수정] parkingName -> resourceName
    .sort({ createdAt: -1 });
};

// 특정 리소스의 리뷰 목록 조회
export const getReviewsByResourceId = async (resourceId, resourceType) => {
  if (resourceType === 'parking') {
    return Review.find({ resourceId: resourceId, resourceType: 'parking' })
      .populate('user', 'username') 
      .sort({ createdAt: -1 });
  } else if (resourceType === 'ev_charger') {
    return Review.find({ resourceId: resourceId, resourceType: 'ev_charger' })
      .populate('user', 'username')
      .sort({ createdAt: -1 });
  } else {
    // [수정] 쿼리 파라미터가 없는 경우 빈 배열이나 에러 대신, 유효한 타입이 아니라는 에러를 반환
    throw new Error('유효하지 않은 리소스 타입입니다.');
  }
};