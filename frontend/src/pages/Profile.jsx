import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getFavoritesByUser, getProfile, getAllParkings, getEvChargers } from "../services/api";
import { useNavigate } from "react-router-dom";

// 표기용 이름 추출
const pName = (p) => p?.name ?? p?.PKLT_NM ?? p?.PARKING_NAME ?? "이름 알 수 없음";
const cName = (c) => c?.charging_station ?? c?.CHARGING_STATION ?? "이름 알 수 없음";

// 여러 식별자 후보를 모두 수집
const idCandidates = (obj, keys) =>
  keys
    .map((k) => obj?.[k])
    .filter((v) => v !== undefined && v !== null && v !== "")
    .map((v) => String(v).trim());

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const uid = user?._id ?? user?.id;

  const [favorites, setFavorites] = useState([]);
  const [parks, setParks] = useState([]);
  const [chargers, setChargers] = useState([]);

  useEffect(() => {
    const run = async () => {
      if (!uid) return;
      try {
        const [{ data: favs }, { data: parkList }, { data: chgList }] = await Promise.all([
          getFavoritesByUser(uid),
          getAllParkings(),
          getEvChargers(),
        ]);
        setFavorites(Array.isArray(favs) ? favs : []);
        setParks(Array.isArray(parkList) ? parkList : []);
        setChargers(Array.isArray(chgList) ? chgList : []);
      } catch (e) {
        console.error("프로필/즐겨찾기 조회 실패", e);
      }
    };
    run();
  }, [uid]);

  // 주차장: 모든 가능 식별자 -> 이름 매핑
  const parkNameByAnyId = useMemo(() => {
    const map = new Map();
    parks.forEach((p) => {
      const name = pName(p);
      const keys = ["_id", "resourceId", "code", "PKLT_CD", "PARKING_CODE"];
      idCandidates(p, keys).forEach((id) => map.set(id, name));
    });
    return map;
  }, [parks]);

  // 충전소: 모든 가능 식별자 -> 이름 매핑
  const chargerNameByAnyId = useMemo(() => {
    const map = new Map();
    chargers.forEach((c) => {
      const name = cName(c);
      const keys = ["resourceId", "CHARGER_ID", "charger_id", "charging_station", "CHARGING_STATION"];
      idCandidates(c, keys).forEach((id) => map.set(id, name));
    });
    return map;
  }, [chargers]);

  if (!user) return <div className="p-4">로그인이 필요합니다.</div>;

  const handleLogout = () => {
    logout();
    navigate("/"); // 메인으로 이동
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">프로필</h1>
        <button className="border rounded px-3 py-1" onClick={handleLogout}>로그아웃</button>
      </div>

      <h2 className="text-xl font-semibold mt-6 mb-2">내 즐겨찾기</h2>
      {favorites.length === 0 && <p className="text-gray-500">즐겨찾기 없음</p>}
      <ul className="list-disc pl-6">
        {favorites.map((f) => {
          const rid = String(f.resourceId ?? "").trim();
          let name = "이름 알 수 없음";
          if (f.resourceType === "parking") {
            name = parkNameByAnyId.get(rid) ?? name;
          } else if (f.resourceType === "ev_charger") {
            name = chargerNameByAnyId.get(rid) ?? name;
          }
          return <li key={f._id}>{name}</li>; // ← 이름만 출력
        })}
      </ul>
    </div>
  );
}
