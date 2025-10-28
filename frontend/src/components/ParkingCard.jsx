import React from "react";
<<<<<<< HEAD

export default function ParkingCard({ parking }) {
  // 필드 이름이 DB 구조에 따라 다를 수 있으므로 안전하게 처리
  const {
    name,
    PARKING_NAME,
    address,
    ADDR,
    capacity,
    CAPACITY,
    tel,
    TEL
  } = parking;

  return (
    <div className="bg-white shadow-md rounded-lg p-4 border border-gray-200 hover:shadow-lg transition">
      <h2 className="text-lg font-semibold text-gray-800">
        {name || PARKING_NAME || "이름 없음"}
      </h2>
      <p className="text-gray-600">{address || ADDR || "주소 정보 없음"}</p>
      <div className="mt-2 text-sm text-gray-500">
        <p>수용 차량 수: {capacity || CAPACITY || "정보 없음"}</p>
        <p>전화번호: {tel || TEL || "정보 없음"}</p>
      </div>
=======
import FavoriteButton from "./FavoriteButton";

export default function ParkingCard({ parking, onOpen, showEvTypes = false, evTypes = [] }) {
  const name = parking?.name ?? parking?.PKLT_NM ?? parking?.PARKING_NAME;
  const address = parking?.address ?? parking?.ADDR ?? parking?.address1;
  const code = parking?.code ?? parking?.PKLT_CD ?? parking?.PARKING_CODE ?? parking?.resourceId;
  const basicFee = Number(parking?.basic_fee ?? 0);
  const addFee = Number(parking?.add_fee ?? 0);
  const dailyMax = Number(parking?.daily_max_fee ?? 0);

  return (
    <div className="border rounded p-4 mb-3 flex items-start justify-between">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold truncate">{name}</h2>
        <p className="text-sm text-gray-600 truncate">{address}</p>
        {/* 코드/좌표는 사용자 노출 X (요구사항) */}
        <div className="text-xs text-gray-700 mt-1">
          기본요금: {basicFee || 0} / 추가요금: {addFee || 0} / 일최대: {dailyMax || 0}
        </div>

        {/* EV 가능 필터가 켜진 경우에만 타입 노출 */}
        {showEvTypes && evTypes.length > 0 && (
          <div className="text-xs text-green-700 mt-1">
            충전기 타입: {evTypes.join(", ")}
          </div>
        )}

        <button
          onClick={() => onOpen?.(parking)}
          className="mt-2 text-sm px-3 py-1 rounded border"
        >
          상세보기
        </button>
      </div>

      <FavoriteButton resourceId={code} resourceType="parking" />
>>>>>>> a1aa543 (프론트엔드 지피티로 만듦)
    </div>
  );
}
