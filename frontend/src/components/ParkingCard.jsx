import React, { useEffect, useState } from "react";
import { getAllParkings } from "../services/api";
import ParkingCard from "../components/ParkingCard";

export default function ParkingList() {
  const [parkings, setParkings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllParkings()
      .then((res) => {
        setParkings(res.data);
      })
      .catch((err) => console.error("데이터 불러오기 실패:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-center mt-10">불러오는 중...</p>;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">서울시 주차장 목록</h1>
      {parkings.map((p) => (
        <ParkingCard key={p._id || p.PARKING_CODE} parking={p} />
      ))}
    </div>
  );
}
