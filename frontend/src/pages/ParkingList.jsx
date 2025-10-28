import React, { useEffect, useState } from "react";
import { getAllParkings } from "../services/api";
import ParkingCard from "../components/ParkingCard";

export default function ParkingList() {
  const [parkings, setParkings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 컴포넌트 최초 마운트 시 단 한 번만 실행됨
    const fetchData = async () => {
      try {
        const res = await getAllParkings();
        if (res?.data?.length) {
          // 서버 전체 데이터 중 상위 5개만 사용
          setParkings(res.data.slice(0, 5));
        } else {
          setParkings([]);
        }
      } catch (err) {
        console.error("데이터 불러오기 실패:", err);
        setError("데이터를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // 빈 배열 필수: 최초 한 번만 호출

  // 로딩/에러/데이터 없음 처리
  if (loading) return <p className="text-center mt-10">불러오는 중입니다...</p>;
  if (error) return <p className="text-center text-red-600 mt-10">{error}</p>;
  if (parkings.length === 0) return <p className="text-center mt-10">표시할 주차장 데이터가 없습니다.</p>;

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6 text-center">서울시 주차장 목록 (상위 5개)</h1>
      <div className="space-y-4">
        {parkings.map((p, idx) => (
          <ParkingCard key={p._id || idx} parking={p} />
        ))}
      </div>
    </div>
  );
}
