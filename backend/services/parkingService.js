// services/parkingService.js
import Parking from '../models/parking.js';
// EvCharger 모델도 필요하다면 import
// import EvCharger from '../models/evCharger.js'; 

//필터와 정렬 조건에 따라 주차장 목록을 조회하는 비즈니스 로직
//(이후 복잡한 필터링/정렬 로직이 이 함수에 추가)
export const findParkings = async (filters = {}, sortOption, userLat, userLon) => {
    const parkings = await Parking.find(filters); 

    console.log(`✅ findParkings 쿼리 성공. 발견된 문서 수: ${parkings.length}`);
    //console.log(parkings);

    return parkings;
};

//특정 ID (코드)로 주차장 상세 정보를 조회
export const findParkingByCode = async (parkingCode) => {
    console.log(`findParkingByCode 실행: 코드 ${parkingCode}`);
    //console.log(Parking.findOne({code:parkingCode}));
    //console.log(typeof(parkingCode));
    console.log(Number(parkingCode));
    return Parking.findOne({ code: parkingCode });
};
