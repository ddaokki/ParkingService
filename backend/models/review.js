// backend/models/review.js
import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  // 1. 작성자 (User 모델과 연결)
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // 2. 주차장 ID ((Parking 또는 EvCharger의 resourceId)
  resourceId: {
    type: String,
    required: true,
    index: true,
  },
  // 3. 리소스 타입 구분
  resourceType: {
    type: String,
    enum: ['parking', 'ev_charger'],
    required: true,
  },
  // 4. 리뷰 텍스트
  text: {
    type: String,
    required: [true, '리뷰 내용을 입력해주세요.'],
    trim: true,
    maxlength: 500,
  },
  // 5. 별점 (1~5)
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: [true, '별점을 선택해주세요.'],
  },
  // 6. [수정] 범영 (조회 편의용)
  resourceName: {
    type: String,
    required: true,
  }
}, {
  timestamps: true // createdAt, updatedAt 자동 생성
});

const Review = mongoose.model('Review', reviewSchema);

export default Review;