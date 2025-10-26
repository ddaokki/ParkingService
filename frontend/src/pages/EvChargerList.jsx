import React, { useEffect, useState } from "react";
import { getEvChargers } from "../services/api";

export default function EvChargerList() {
  const [chargers, setChargers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEvChargers()
      .then((res) => setChargers(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-center mt-10">불러오는 중...</p>;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">전기차 충전소 목록</h1>
      {chargers.map((c, i) => (
        <div key={i} className="bg-white shadow p-4 rounded-lg mb-3">
          <h2 className="text-lg font-semibold">{c.CHARGING_STATION}</h2>
          <p>{c.ADDRESS}</p>
          <p>충전기 타입: {c.CHARGER_TYPE || "정보 없음"}</p>
        </div>
      ))}
    </div>
  );
}
