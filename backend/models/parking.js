import { Schema, model } from 'mongoose';

const ParkingSchema = new Schema({
  resourceId: { type: String, required: true, index: true },  // CSV 고유 ID
  name: { type: String, required: true },                     // 주차장 이름
  address: { type: String, required: true },                  // 주소
  code: { type: String, required: true },                     // 주차장 코드
  lat: { type: Number, required: true },                      // 위도
  lon: { type: Number, required: true },                      // 경도
  total_parking: { type: Number, default: 0 },                // 총 주차면 수
  basic_fee: { type: Number, default: 0 },                    // 기본 요금
  add_fee: { type: Number, default: 0 },                      // 추가 요금
  add_unit_min: { type: Number, default: 0 },                 // 추가 단위 시간
  daily_max_fee: { type: Number, default: 0 },                // 일 최대 요금
  prk_hm: { type: Number, default: 0 },                       // 주차 시간
  last_sync: { type: Date },                                  // 마지막 동기화 시간
  pklt_knd: { type: String },                                 // 주차장 종류 코드
  pklt_knd_nm: { type: String },                              // 주차장 종류 이름

  // ✅ 추가: GeoJSON 형태의 위치 정보
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [경도, 위도] 순서 중요!
      index: '2dsphere',
      required: true,
    },
  },
});

// 저장 시 lat/lon → GeoJSON 변환 자동화
ParkingSchema.pre('save', function (next) {
  if (this.lat && this.lon) {
    this.location = {
      type: 'Point',
      coordinates: [this.lon, this.lat],
    };
  }
  next();
});

export default model('parking', ParkingSchema, 'parking');
