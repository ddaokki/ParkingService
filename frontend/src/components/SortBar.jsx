import React from "react";

export default function SortBar({ value, onChange }) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <label className="font-medium">정렬:</label>
      <select
        className="border rounded px-2 py-1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="feeAsc">기본요금 낮은순</option>
        <option value="distanceAsc">거리 가까운순</option>
        <option value="addFeeAsc">추가요금 낮은순</option>
      </select>
    </div>
  );
}
