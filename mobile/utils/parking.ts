// utils/parking.ts

export const getPid = (p: any) =>
  String(
    p?.resourceId ??
      p?.code ??
      p?._id ??
      p?.id ??
      p?.PKLT_CD ??
      p?.PARKING_CODE ??
      ""
  );

export const getName = (p: any) =>
  String(p?.name ?? p?.PKLT_NM ?? p?.PARKING_NAME ?? p?.PARKING_NM ?? "주차장");

export const getAddr = (p: any) =>
  String(
    p?.address ?? p?.PKLT_ADDR ?? p?.PARKING_ADDR ?? p?.ADDR ?? p?.RDNMADR ?? ""
  );

/** "100원", "100", "0", 0, null 등 섞여 들어와도 숫자만 추출 */
export const toFeeNumber = (v: any): number | null => {
  if (v === null || v === undefined) return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;

  const s = String(v).trim();
  if (!s) return null;

  const m = s.match(/-?\d+/g);
  if (!m) return null;

  const n = Number(m.join(""));
  return Number.isFinite(n) ? n : null;
};

export const getBaseFee = (p: any): number | null => {
  return (
    // ✅ 귀하 스키마(우선)
    toFeeNumber(p?.basic_fee) ??
    toFeeNumber(p?.basicFee) ??
    // 기타 호환
    toFeeNumber(p?.BASIC_CHARGE) ??
    toFeeNumber(p?.PKLT_BS_CHRG) ??
    toFeeNumber(p?.BASS_FEE) ??
    toFeeNumber(p?.기본요금) ??
    null
  );
};

export const getAddFee = (p: any): number | null => {
  return (
    // ✅ 귀하 스키마(우선)
    toFeeNumber(p?.add_fee) ??
    toFeeNumber(p?.addFee) ??
    // 기타 호환
    toFeeNumber(p?.ADD_CHARGE) ??
    toFeeNumber(p?.PKLT_ADD_CHRG) ??
    toFeeNumber(p?.ADIT_FEE) ??
    toFeeNumber(p?.추가요금) ??
    null
  );
};

export const getDailyMaxFee = (p: any): number | null => {
  return (
    // ✅ 귀하 스키마(우선)
    toFeeNumber(p?.daily_max_fee) ??
    toFeeNumber(p?.dailyMaxFee) ??
    // 기타 호환
    toFeeNumber(p?.DAY_MAX_FEE) ??
    toFeeNumber(p?.일일최대요금) ??
    null
  );
};

export const getAddUnitMin = (p: any): number | null => {
  return (
    // ✅ 귀하 스키마(우선)
    toFeeNumber(p?.add_unit_min) ??
    toFeeNumber(p?.addUnitMin) ??
    // 기타 호환
    toFeeNumber(p?.ADD_UNIT_MIN) ??
    null
  );
};

/**
 * 유료/무료 판별
 * - 스키마상 0이면 무료로 보는 것이 가장 확실함
 * - 값이 없으면 unknown
 */
export const getPayType = (p: any): "free" | "paid" | "unknown" => {
  const base = getBaseFee(p);
  const add = getAddFee(p);
  const dayMax = getDailyMaxFee(p);

  // 값이 하나라도 있으면 판단
  const hasAny =
    base !== null ||
    add !== null ||
    dayMax !== null ||
    p?.payType !== undefined;

  // 명시 텍스트가 있으면 우선
  const text = String(p?.payType ?? p?.유무료 ?? "").toLowerCase();
  if (text.includes("무료") || text === "free") return "free";
  if (text.includes("유료") || text === "paid") return "paid";

  if (!hasAny) return "unknown";

  // 숫자 기반 판정
  const b = base ?? 0;
  const a = add ?? 0;
  const d = dayMax ?? 0;

  if (b === 0 && a === 0 && d === 0) return "free";
  if (b > 0 || a > 0 || d > 0) return "paid";

  return "unknown";
};

/**
 * EV 가능 여부
 * - 귀하 현재 주차장 스키마에는 EV 관련 필드가 없어 보임
 * - 따라서 주차장 단독으로는 기본 false
 * - (EV 충전소 데이터와 매핑해서 주차장에 EV 가능 플래그를 붙이는 방식은 별도 로직에서 처리)
 */
export const hasEv = (p: any): boolean => {
  const v =
    p?.ev ??
    p?.EV ??
    p?.EV_CHARGE ??
    p?.EV_YN ??
    p?.CHRG_YN ??
    p?.EV_CHARGER ??
    p?.전기차충전;

  if (v === true || v === 1) return true;
  const s = String(v ?? "").toLowerCase();
  return s === "y" || s === "yes" || s.includes("가능") || s.includes("true");
};
