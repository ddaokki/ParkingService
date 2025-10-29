import React, { useEffect, useMemo, useState } from "react";
import { getAllParkings, getEvChargers } from "../services/api";
import ParkingCard from "../components/ParkingCard";
import SearchBar from "../components/SearchBar";
import SortBar from "../components/SortBar";
import FilterBar from "../components/FilterBar";
import Modal from "../components/Modal";
import MapViewKakao from "../components/MapViewKakao";
import { distanceMeters, pickLat, pickLon } from "../utils/geo";
import { getCurrentPosition } from "../utils/getLocation";

function isFreeParking(p) {
  const toNum = (v) => (v === null || v === undefined || v === "" ? 0 : Number(v));
  const bf = toNum(p?.basic_fee);
  const af = toNum(p?.add_fee);
  const dmf = toNum(p?.daily_max_fee);
  return !bf && !af && !dmf;
}

const parkingName = (p) => (p?.name ?? p?.PKLT_NM ?? p?.PARKING_NAME ?? "").toString();
const parkingAddr = (p) => (p?.address ?? p?.ADDR ?? p?.address1 ?? "").toString();
const parkingCode = (p) =>
  p?._id ?? p?.code ?? p?.PKLT_CD ?? p?.PARKING_CODE ?? p?.resourceId;

export default function ParkingList() {
  const [all, setAll] = useState([]);
  const [chargers, setChargers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [chargeFilter, setChargeFilter] = useState(null);
  const [sortKey, setSortKey] = useState("feeAsc");
  const [onlyEv, setOnlyEv] = useState(false);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");
  const [myPos, setMyPos] = useState(null);

  // ✅ 내 위치 가져오기
  useEffect(() => {
    getCurrentPosition()
      .then(setMyPos)
      .catch((err) => console.error("위치 정보를 가져오지 못했습니다:", err));
  }, []);

  // ✅ 데이터 로드
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
        setError("데이터를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const EV_RADIUS_M = 150;
  const evTypesByParking = useMemo(() => {
    const map = new Map();
    chargers.forEach((c) => {
      const clat = pickLat(c),
        clon = pickLon(c);
      const ctype = (c?.charger_type ?? c?.CHARGER_TYPE ?? "").toString().trim();
      if (!clat || !clon) return;
      all.forEach((p) => {
        const pid = String(parkingCode(p));
        const plat = pickLat(p),
          plon = pickLon(p);
        if (!plat || !plon) return;
        if (distanceMeters(plat, plon, clat, clon) <= EV_RADIUS_M) {
          if (!map.has(pid)) map.set(pid, new Set());
          if (ctype) map.get(pid).add(ctype);
        }
      });
    });
    return map;
  }, [chargers, all]);

  // ✅ 필터 및 정렬
  const filtered = useMemo(() => {
    let arr = all;
    if (!myPos) return [];

    // 검색
    if (q.trim()) {
      const key = q.trim().toLowerCase();
      arr = arr.filter(
        (p) =>
          parkingName(p).toLowerCase().includes(key) ||
          parkingAddr(p).toLowerCase().includes(key)
      );
    }

    // 무료/유료
    if (chargeFilter === "무료") arr = arr.filter(isFreeParking);
    if (chargeFilter === "유료") arr = arr.filter((p) => !isFreeParking(p));
    if (onlyEv) arr = arr.filter((p) => evTypesByParking.has(String(parkingCode(p))));

    // 내 위치 기준 반경 1km
    arr = arr.filter((p) => {
      const lat = pickLat(p),
        lon = pickLon(p);
      if (!lat || !lon) return false;
      return distanceMeters(myPos.lat, myPos.lon, lat, lon) <= 1000;
    });

    // 정렬
    const sorted = [...arr];
    if (sortKey === "feeAsc")
      sorted.sort((a, b) => Number(a.basic_fee ?? 0) - Number(b.basic_fee ?? 0));
    if (sortKey === "addFeeAsc")
      sorted.sort((a, b) => Number(a.add_fee ?? 0) - Number(b.add_fee ?? 0));
    if (sortKey === "distanceAsc")
      sorted.sort(
        (a, b) =>
          distanceMeters(myPos.lat, myPos.lon, pickLat(a), pickLon(a)) -
          distanceMeters(myPos.lat, myPos.lon, pickLat(b), pickLon(b))
      );

    return sorted;
  }, [all, q, chargeFilter, onlyEv, sortKey, evTypesByParking, myPos]);

  if (loading) return <div className="p-4">불러오는 중…</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  const limited = filtered.slice(0, 10);
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

      {/* ✅ 지도 + 내 위치 드래그 가능 */}
      <MapViewKakao
        items={limited}
        selectedId={selectedId}
        onMarkerClick={(p) => setSelected(p)}
        myPos={myPos}
        onMyPosChange={(pos) => setMyPos(pos)}
      />

      <div className="mt-4">
        {limited.map((p) => {
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
        {limited.length === 0 && (
          <p className="text-gray-500">표시할 항목이 없습니다.</p>
        )}
      </div>

      <Modal
        open={!!selected}
        title={selected ? parkingName(selected) || "주차장 상세" : ""}
        onClose={() => setSelected(null)}
      >
        {selected && (
          <div className="space-y-2 text-sm">
            <div>
              <b>주소:</b> {parkingAddr(selected)}
            </div>
            <div>
              <b>요금:</b>{" "}
              {isFreeParking(selected)
                ? "무료"
                : `기본 ${selected.basic_fee ?? 0} / 추가 ${selected.add_fee ?? 0}`}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
