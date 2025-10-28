import React, { useEffect, useState } from "react";
import { addFavorite, getFavoritesByUser, removeFavorite } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function FavoriteButton({ resourceId, resourceType }) {
  const { user } = useAuth();
  const uid = user?._id ?? user?.id;
  const [favoriteId, setFavoriteId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (!uid) return;
      try {
        const { data } = await getFavoritesByUser(uid);
        const found = data?.find?.(
          (f) => String(f.resourceId) === String(resourceId) && f.resourceType === resourceType
        );
        setFavoriteId(found?._id || null);
      } catch (e) {
        console.error("즐겨찾기 조회 실패", e);
      }
    };
    run();
  }, [uid, resourceId, resourceType]);

  const toggle = async () => {
    if (!uid) return alert("로그인이 필요합니다.");
    setLoading(true);
    try {
      if (favoriteId) {
        await removeFavorite({ favoriteId, userId: uid });
        setFavoriteId(null);
      } else {
        const { data } = await addFavorite({ userId: uid, resourceId, resourceType });
        setFavoriteId(data?._id || true);
      }
    } catch (e) {
      console.error("즐겨찾기 토글 실패", e);
      alert("즐겨찾기 처리 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`text-sm px-3 py-1 rounded border ${favoriteId ? "bg-yellow-200" : "bg-white"}`}
      aria-pressed={!!favoriteId}
      title={favoriteId ? "즐겨찾기 해제" : "즐겨찾기 추가"}
    >
      {favoriteId ? "★ 즐겨찾기됨" : "☆ 즐겨찾기"}
    </button>
  );
}
