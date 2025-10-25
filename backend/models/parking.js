// backend/models/parking.js
const mongoose = require('mongoose');

const ParkingSchema = new mongoose.Schema({
  name: { type: String, required: true },                  // 주차장 이름
  address: { type: String, required: true },               // 주소
  code: { type: String, required: true },                  // 주차장 코드
  PKLT_KND: { type: String },                              // 주차장 종류 코드
  PKLT_KND_NM: { type: String },                           // 주차장 종류 이름
  OPER_SE: { type: String },                               // 운영 형태 코드
  OPER_SE_NM: { type: String },                            // 운영 형태 이름
  TELNO: { type: String },                                 // 전화번호
  PRK_NOW_INFO_PVSN_YN: { type: String },                 // 실시간 주차 정보 연계 여부(Y/N)
  PRK_NOW_INFO_PVSN_YN_NM: { type: String },              // 연계 여부 이름
  total_parking: { type: Number },                         // 총 주차면 수
  CHGD_FREE_SE: { type: String },                          // 유료 여부 코드
  CHGD_FREE_NM: { type: String },                          // 유료 여부 이름
  NGHT_FREE_OPN_YN: { type: String },                      // 야간 개방 여부 코드
  NGHT_FREE_OPN_YN_NAME: { type: String },                 // 야간 개방 여부 이름
  WD_OPER_BGNG_TM: { type: String },                       // 평일 운영 시작 시간
  WD_OPER_END_TM: { type: String },                        // 평일 운영 종료 시간
  WE_OPER_BGNG_TM: { type: String },                       // 주말 운영 시작 시간
  WE_OPER_END_TM: { type: String },                        // 주말 운영 종료 시간
  LHLDY_BGNG: { type: String },                            // 공휴일 시작 시간
  LHLDY: { type: String },                                 // 공휴일 종료 시간
  LAST_DATA_SYNC_TM: { type: Date },                       // 마지막 데이터 동기화 시간
  SAT_CHGD_FREE_SE: { type: String },                      // 토요일 요금 여부 코드
  SAT_CHGD_FREE_NM: { type: String },                      // 토요일 요금 여부 이름
  LHLDY_YN: { type: String },                              // 공휴일 요금 여부 코드
  LHLDY_NM: { type: String },                               // 공휴일 요금 여부 이름
  MNTL_CMUT_CRG: { type: Number },                         // 월정기 요금
  CRB_PKLT_MNG_GROUP_NO: { type: String },                 // 관리 그룹 번호
  basic_fee: { type: Number },                              // 기본 요금
  PRK_HM: { type: Number },                                 // 주차 시간
  ADD_CRG: { type: Number },                                // 추가 요금
  ADD_UNIT_TM_MNT: { type: Number },                        // 추가 단위 시간
  DLY_MAX_CRG: { type: Number },                            // 일 최대 요금
  lat: { type: Number },                                    // 위도
  lon: { type: Number }                                     // 경도
});

module.exports = mongoose.model('Parking', ParkingSchema);
