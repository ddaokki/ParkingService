import React from "react";

export default function FilterBar({
  chargeValue,
  onChargeChange,
  onlyEvAvailable,
  onOnlyEvChange,
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 mb-3">
      <div className="flex items-center gap-2">
        <label className="font-medium">요금 구분:</label>
        <select
          className="border rounded px-2 py-1"
          value={chargeValue || ""}
          onChange={(e) => onChargeChange(e.target.value || null)}
        >
          <option value="">전체</option>
          <option value="무료">무료</option>
          <option value="유료">유료</option>
        </select>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={!!onlyEvAvailable}
          onChange={(e) => onOnlyEvChange(e.target.checked)}
        />
        전기차 충전 가능 주차장만
      </label>
    </div>
  );
}
