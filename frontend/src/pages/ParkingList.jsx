import React, { useEffect, useMemo, useState } from "react";
import { getAllParkings, getEvChargers } from "../services/api";
import ParkingCard from "../components/ParkingCard";
import SearchBar from "../components/SearchBar";
import SortBar from "../components/SortBar";
import FilterBar from "../components/FilterBar";
import Modal from "../components/Modal";
import MapViewVWorld from "../components/MapViewVWorld";
import { distanceMeters, pickLat, pickLon } from "../utils/geo";

function isFreeParking(p) {
  const toNum = (v) => (v === null || v === undefined || v === "" ? 0 : Number(v));
  const bf = toNum(p?.basic_fee);
  const af = toNum(p?.add_fee);
  const dmf = toNum(p?.daily_max_fee);
  return (!bf && !af && !dmf);
}
const parkingName = (p) => (p?.name ?? p?.PKLT_NM ?? p?.PARKING_NAME ?? "").toString();
const parkingAddr = (p) => (p?.address ?? p?.ADDR ?? p?.address1 ?? "").toString();
const parkingCode = (p) => p?._id ?? p?.code ?? p?.PKLT_CD ?? p?.PARKING_CODE ?? p?.resourceId;

export default function ParkingList() {
  const [all, setAll] = useState([]);
  const [chargers, setChargers] = useState([]);
  const [loading, setLoading] = useState(true);
<<<<<<< HEAD
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
=======
  const [q, setQ] = useState("");
  const [chargeFilter, setChargeFilter] = useState(null);
  const [sortKey, setSortKey] = useState("nameAsc");
  const [onlyEv, setOnlyEv] = useState(false);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const [{ data: parks }, { data: evs }] = await Promise.all([
          getAllParkings(),
          getEvChargers(),
        ]);
        setAll(Array.isArray(parks) ? parks : []);
        setChargers(Array.isArray(evs) ? evs : []);
      } catch (e) {
        console.error(e);
>>>>>>> a1aa543 (프론트엔드 지피티로 만듦)
        setError("데이터를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };
<<<<<<< HEAD

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
=======
    run();
  }, []);

  // EV 반경/타입 집계
  const EV_RADIUS_M = 150;
  const evTypesByParking = useMemo(() => {
    // Map<parkingCode, Set<charger_type>>
    const map = new Map();
    chargers.forEach((c) => {
      const clat = pickLat(c), clon = pickLon(c);
      const ctype = (c?.charger_type ?? c?.CHARGER_TYPE ?? "").toString().trim();
      if (!clat || !clon) return;
      all.forEach((p) => {
        const pid = String(parkingCode(p));
        const plat = pickLat(p), plon = pickLon(p);
        if (!plat || !plon) return;
        if (distanceMeters(plat, plon, clat, clon) <= EV_RADIUS_M) {
          if (!map.has(pid)) map.set(pid, new Set());
          if (ctype) map.get(pid).add(ctype);
        }
      });
    });
    return map;
  }, [chargers, all]);

  const filtered = useMemo(() => {
    let arr = all;

    if (q.trim()) {
      const key = q.trim().toLowerCase();
      arr = arr.filter(
        (p) => parkingName(p).toLowerCase().includes(key) || parkingAddr(p).toLowerCase().includes(key)
      );
    }

    if (chargeFilter === "무료") arr = arr.filter(isFreeParking);
    if (chargeFilter === "유료") arr = arr.filter((p) => !isFreeParking(p));

    if (onlyEv) arr = arr.filter((p) => evTypesByParking.has(String(parkingCode(p))));

    const getFee = (p) => Number(p?.basic_fee ?? 0) + Number(p?.add_fee ?? 0) + Number(p?.daily_max_fee ?? 0);
    const sorted = [...arr];
    if (sortKey === "nameAsc") sorted.sort((a, b) => parkingName(a).localeCompare(parkingName(b)));
    if (sortKey === "nameDesc") sorted.sort((a, b) => parkingName(b).localeCompare(parkingName(a)));
    if (sortKey === "feeAsc") sorted.sort((a, b) => getFee(a) - getFee(b));
    if (sortKey === "feeDesc") sorted.sort((a, b) => getFee(b) - getFee(a));

    return sorted;
  }, [all, q, chargeFilter, onlyEv, sortKey, evTypesByParking]);

  if (loading) return <div className="p-4">불러오는 중…</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  const selectedId = selected && parkingCode(selected);

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-3">서울시 주차장</h1>

      <div className="grid md:grid-cols-2 gap-4">
        <SearchBar value={q} onChange={setQ} />
        <SortBar value={sortKey} onChange={setSortKey} />
      </div>
      <FilterBar
        chargeValue={chargeFilter}
        onChargeChange={setChargeFilter}
        onlyEvAvailable={onlyEv}
        onOnlyEvChange={setOnlyEv}
      />

      <MapViewVWorld
        items={filtered.slice(0, 200)}
        selectedId={selectedId}
        onMarkerClick={(p) => setSelected(p)}
      />

      <div className="mt-4">
        {filtered.map((p) => {
          const pid = String(parkingCode(p));
          const types = evTypesByParking.get(pid);
          const evTypeList = types ? Array.from(types) : [];
          return (
            <ParkingCard
              key={pid}
              parking={p}
              onOpen={() => setSelected(p)}
              showEvTypes={onlyEv}
              evTypes={evTypeList}
            />
          );
        })}
        {filtered.length === 0 && <p className="text-gray-500">표시할 항목이 없습니다.</p>}
      </div>

      <Modal
        open={!!selected}
        title={selected ? (parkingName(selected) || "주차장 상세") : ""}
        onClose={() => setSelected(null)}
      >
        {selected && (
          <div className="space-y-2 text-sm">
            <div><b>주소:</b> {parkingAddr(selected)}</div>
            {/* 코드/좌표는 사용자에겐 숨김 요구 → 상세에서도 미표시 */}
            <div>
              <b>요금:</b> 기본 {Number(selected?.basic_fee ?? 0)} / 추가 {Number(selected?.add_fee ?? 0)} / 일최대 {Number(selected?.daily_max_fee ?? 0)}
            </div>
          </div>
        )}
      </Modal>
>>>>>>> a1aa543 (프론트엔드 지피티로 만듦)
    </div>
  );
}
