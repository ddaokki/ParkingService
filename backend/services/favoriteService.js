// backend/services/favoriteService.js
import Favorite from '../models/favorite.js';
import Parking from '../models/parking.js';
import EvCharger from '../models/evCharger.js';
import mongoose from 'mongoose';

/**
 * 즐겨찾기 추가
 */
export const addFavorite = async (userId, resourceId, resourceType) => {
  // 1. 중복 확인
  const existing = await Favorite.findOne({ user: userId, resourceId });
  if (existing) {
    throw new Error('이미 즐겨찾기에 추가된 항목입니다.');
  }

  // 2. 생성
  const newFavorite = new Favorite({
    user: userId,
    resourceId,
    resourceType, // 'parking' or 'ev_charger'
  });
  await newFavorite.save();
  return newFavorite;
};

/**
 * 즐겨찾기 삭제 (즐겨찾기 문서의 _id 기준)
 */
export const removeFavorite = async (userId, favoriteId) => {
  if (!mongoose.Types.ObjectId.isValid(favoriteId)) {
    throw new Error('유효하지 않은 ID입니다.');
  }
  
  // 1. 본인 소유인지 확인하며 삭제
  const result = await Favorite.findOneAndDelete({ 
    _id: favoriteId, 
    user: userId 
  });
  
  if (!result) {
    throw new Error('즐겨찾기를 찾을 수 없거나 삭제 권한이 없습니다.');
  }
  return result;
};

/**
 * 내 즐겨찾기 목록 조회 (상세 정보 포함)
 */
export const getFavoritesByUserId = async (userId) => {
  // 1. 내 즐겨찾기 목록을 시간 역순으로 조회
  const favorites = await Favorite.find({ user: userId }).sort({ createdAt: -1 });

  // 2. 즐겨찾기된 resourceId들을 모두 추출
  const resourceIds = favorites.map(f => f.resourceId);
  if (resourceIds.length === 0) {
    return [];
  }

  // 3. Parking과 EvCharger 컬렉션에서 상세 정보 병렬 조회
  const [parkings, evChargers] = await Promise.all([
    Parking.find({ resourceId: { $in: resourceIds } }).lean(),
    EvCharger.find({ resourceId: { $in: resourceIds } }).lean()
  ]);

  // 4. (메모리에서) 데이터 조합
  const detailsMap = new Map();
  parkings.forEach(p => detailsMap.set(p.resourceId, p));
  evChargers.forEach(e => detailsMap.set(e.resourceId, e));

  // 5. 최종 결과: 즐겨찾기 정보 + 상세 정보
  return favorites.map(fav => ({
    ...fav.toObject(), // 즐겨찾기 정보 (fav._id, createdAt 등)
    details: detailsMap.get(fav.resourceId) || null // 주차장/충전소 상세 정보
  }));
};