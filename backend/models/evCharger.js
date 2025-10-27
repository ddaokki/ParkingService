import { Schema, model } from 'mongoose';

const EvChargerSchema = new Schema({
  resourceId: { type: Number, required: true },          // CSV 고유 ID
  oper_inst_nm: { type: String },                       // 운영 기관명
  charging_station: { type: String, required: true },   // 충전소 이름
  charger_id: { type: String },                         // 충전기 ID
  charger_type: { type: String },                       // AC/DC, 완속/급속
  fclt_se_l: { type: String },                           // 시설 구분 (대분류)
  fclt_se_s: { type: String },                           // 시설 구분 (세부)
  region: { type: String, required: true },             // 광역시/도
  sgg: { type: String },                                 // 시/군/구
  address: { type: String, required: true },            // 주소
  utztn_psblty_tm: { type: String },                    // 이용 가능 시간
  utztn_user_lmt: { type: String },                     // 이용자 제한
  charging_capacity: { type: String },                  // 충전 용량
  con_pvsn: { type: String },                           // 제공 상태
  remark: { type: String },                              // 비고
  lat: { type: Number, required: true },                // 위도
  lon: { type: Number, required: true },                // 경도
  charger_count: { type: Number, default: 1 }           // 충전기 수
});

export default model('evCharger', EvChargerSchema, 'ev_charger');
