import React from "react";

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
    </div>
  );
}
