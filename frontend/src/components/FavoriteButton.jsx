// frontend/src/components/FavoriteButton.jsx
import React, { useEffect, useState } from "react";
import { addFavorite, getFavoritesByUser, removeFavorite } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function FavoriteButton({ resourceId, resourceType }) {
  const { user } = useAuth();
  const uid = user?._id ?? user?.id;
  const [favoriteId, setFavoriteId] = useState(null);
  const [loading, setLoading] = useState(false);

  // 로그인한 사용자의 즐겨찾기 목록을 불러와서 현재 리소스가 즐겨찾기인지 확인
  useEffect(() => {
    const run = async () => {
      if (!uid) return;
      try {
        const { data } = await getFavoritesByUser(uid);
        const found = Array.isArray(data)
          ? data.find(
              (f) =>
                String(f.resourceId) === String(resourceId) &&
                String(f.resourceType) === String(resourceType)
            )
          : null;
        setFavoriteId(found?._id ?? found?.id ?? null);
      } catch (e) {
        console.error("즐겨찾기 상태 조회 실패:", e);
      }
    };
    run();
  }, [uid, resourceId, resourceType]);

  const toggle = async () => {
    if (!uid) {
      alert("로그인이 필요합니다.");
      return;
    }
    setLoading(true);
    try {
      if (favoriteId) {
        // 즐겨찾기 해제
        await removeFavorite({ favoriteId, userId: uid });
        setFavoriteId(null);
      } else {
        // 즐겨찾기 추가
        const { data } = await addFavorite({
          userId: uid,
          resourceId,
          resourceType,
        });
        const newId = data?._id ?? data?.id ?? null;
        setFavoriteId(newId);
      }
    } catch (e) {
      console.error("즐겨찾기 토글 실패:", e);
      alert("즐겨찾기 처리 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`text-sm px-3 py-1 rounded border ${
        favoriteId ? "bg-yellow-200" : "bg-white"
      }`}
      aria-pressed={!!favoriteId}
      title={favoriteId ? "즐겨찾기 해제" : "즐겨찾기 추가"}
    >
      {favoriteId ? "★ 즐겨찾기됨" : "☆ 즐겨찾기"}
    </button>
  );
}
