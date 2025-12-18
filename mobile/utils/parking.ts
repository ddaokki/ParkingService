// utils/parking.ts

export const getPid = (p: any) =>
  String(
    p?._id ??
      p?.id ??
      p?.code ??
      p?.PKLT_CD ??
      p?.PARKING_CODE ??
      p?.resourceId ??
      ""
  );

export const getName = (p: any) =>
  String(p?.name ?? p?.PKLT_NM ?? p?.PARKING_NAME ?? p?.PARKING_NM ?? "주차장");

export const getAddr = (p: any) =>
  String(
    p?.address ?? p?.ADDR ?? p?.PKLT_ADDR ?? p?.PARKING_ADDR ?? p?.RDNMADR ?? ""
  );

/** "100원", "100", null 등 섞여 들어와도 숫자만 추출 */
export const toFeeNumber = (v: any): number | null => {
  if (v === null || v === undefined) return null;
  const s = String(v);
  const m = s.match(/-?\d+/g);
  if (!m) return null;
  const n = Number(m.join(""));
  return Number.isFinite(n) ? n : null;
};

export const getBaseFee = (p: any): number | null => {
  return (
    toFeeNumber(p?.baseFee) ??
    toFeeNumber(p?.BASIC_CHARGE) ??
    toFeeNumber(p?.PKLT_BS_CHRG) ??
    toFeeNumber(p?.BASS_FEE) ??
    toFeeNumber(p?.기본요금) ??
    null
  );
};

export const getAddFee = (p: any): number | null => {
  return (
    toFeeNumber(p?.addFee) ??
    toFeeNumber(p?.ADD_CHARGE) ??
    toFeeNumber(p?.PKLT_ADD_CHRG) ??
    toFeeNumber(p?.ADIT_FEE) ??
    toFeeNumber(p?.추가요금) ??
    null
  );
};

/** 유료/무료 판별: 데이터 컬럼이 제각각이라 “요금이 0이면 무료” + “문자열 힌트” 혼합 */
export const getPayType = (p: any): "free" | "paid" | "unknown" => {
  const text = `${
    p?.payType ?? p?.PAY_YN ?? p?.CHARGE_YN ?? p?.유무료 ?? ""
  }`.toLowerCase();

  if (text.includes("무료") || text === "free" || text === "n") return "free";
  if (text.includes("유료") || text === "paid" || text === "y") return "paid";

  const base = getBaseFee(p);
  const add = getAddFee(p);

  if (base === 0 && (add === 0 || add === null)) return "free";
  if ((base !== null && base > 0) || (add !== null && add > 0)) return "paid";

  return "unknown";
};

/** 전기차 충전 가능 여부(컬럼 추정) */
export const hasEv = (p: any): boolean => {
  const v =
    p?.ev ??
    p?.EV ??
    p?.EV_CHARGE ??
    p?.EV_YN ??
    p?.CHRG_YN ??
    p?.EV_CHARGER ??
    p?.전기차충전;
  const s = String(v ?? "").toLowerCase();
  if (v === true) return true;
  if (v === 1) return true;
  if (
    s === "y" ||
    s === "yes" ||
    s.includes("가능") ||
    s.includes("있음") ||
    s.includes("true")
  )
    return true;
  return false;
};
