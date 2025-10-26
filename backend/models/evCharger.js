// backend/models/evCharger.js
import { Schema, model } from 'mongoose';

const EvChargerSchema = new Schema({
  charging_station: { type: String, required: true },    // 충전소 이름
  oper_inst_nm: { type: String },                        // 운영 기관명
  fclt_se_l: { type: String },                            // 시설 구분 (대분류)
  fclt_se_s: { type: String },                            // 시설 구분 (세부)
  region: { type: String },                               // 광역시/도
  sgg: { type: String },                                  // 시/군/구
  address: { type: String, required: true },             // 주소
  utztn_psblty_tm: { type: String },                     // 이용 가능 시간
  lat: { type: Number },                                  // 위도
  lon: { type: Number },                                  // 경도
  charger_count: { type: Number }                         // 충전기 수
});

export default model('evCharger', EvChargerSchema, 'ev_charger');
