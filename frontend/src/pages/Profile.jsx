import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getFavoritesByUser,
  getAllParkings,
  getEvChargers,
  removeFavorite,
} from "../services/api";
import { useNavigate } from "react-router-dom";
import ParkingCard from "../components/ParkingCard";
import Modal from "../components/Modal";

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
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

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
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [uid]);

  const parkById = useMemo(() => {
    const map = new Map();
    parks.forEach((p) => {
      const keys = ["_id", "resourceId", "code", "PKLT_CD", "PARKING_CODE"];
      idCandidates(p, keys).forEach((id) => map.set(id, p));
    });
    return map;
  }, [parks]);

  const handleRemoveFavorite = async (favId) => {
    if (!uid) return alert("로그인 정보가 없습니다.");
    try {
      await removeFavorite({ favoriteId: favId, userId: uid });
      setFavorites((prev) => prev.filter((f) => f._id !== favId));
    } catch (e) {
      console.error("즐겨찾기 제거 실패:", e);
      alert("즐겨찾기 제거 중 오류가 발생했습니다.");
    }
  };

  if (!user) return <div className="p-4">로그인이 필요합니다.</div>;
  if (loading) return <div className="p-4">불러오는 중...</div>;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const parkingAddr = (p) => p?.address ?? p?.ADDR ?? p?.address1 ?? "주소 없음";
  const pName = (p) => p?.name ?? p?.PKLT_NM ?? p?.PARKING_NAME ?? "이름 알 수 없음";
  const toNum = (v) => (v === null || v === undefined || v === "" ? 0 : Number(v));
  const isFree = (p) =>
    !toNum(p?.basic_fee) && !toNum(p?.add_fee) && !toNum(p?.daily_max_fee);

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">프로필</h1>
        <button
          className="border rounded px-3 py-1 hover:bg-gray-100"
          onClick={handleLogout}
        >
          로그아웃
        </button>
      </div>

      <h2 className="text-xl font-semibold mt-6 mb-2">내 즐겨찾기</h2>
      {favorites.length === 0 && <p className="text-gray-500">즐겨찾기 없음</p>}

      {/* ✅ 불필요한 div 제거 — 카드 자체를 그대로 렌더링 */}
      <div className="space-y-3">
        {favorites.map((f) => {
          const rid = String(f.resourceId ?? "").trim();
          const p = parkById.get(rid);
          if (!p) return null;

          return (
            <ParkingCard
              key={f._id}
              parking={p}
              onOpen={() => setSelected(p)}
            />
          );
        })}
      </div>

      <Modal
        open={!!selected}
        title={selected ? pName(selected) || "주차장 상세" : ""}
        onClose={() => setSelected(null)}
      >
        {selected && (
          <div className="space-y-2 text-sm">
            <div>
              <b>주소:</b> {parkingAddr(selected)}
            </div>
            <div>
              <b>요금:</b>{" "}
              {isFree(selected)
                ? "무료"
                : `기본 ${toNum(selected.basic_fee)}원 / 추가 ${toNum(
                    selected.add_fee
                  )}원 / 일최대 ${toNum(selected.daily_max_fee)}원`}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
