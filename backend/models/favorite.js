// backend/models/Favorite.js
import mongoose from 'mongoose';

const favoriteSchema = new mongoose.Schema({
  // 어떤 사용자가 즐겨찾기 했는지
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // 'User' 모델을 참조
    required: true,
  },
  // 어떤 자원을 즐겨찾기 했는지 (Parking 또는 EV_Charger)
  resourceId: {
    type: String,
    required: true,
  },
  // (선택사항) 'parking'인지 'ev'인지 구분
  resourceType: {
    type: String,
    enum: ['parking', 'ev_charger'],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// [핵심] 복합 인덱스 (Compound Index)
// 1. 한 유저가 동일한 resourceId를 중복 저장하는 것을 방지
// 2. 유저 ID로 즐겨찾기 목록을 조회할 때 매우 빠르게 동작
favoriteSchema.index({ user: 1, resourceId: 1 }, { unique: true });

const Favorite = mongoose.model('Favorite', favoriteSchema);

export default Favorite;