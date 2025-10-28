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
        <option value="nameAsc">이름 오름차순</option>
        <option value="nameDesc">이름 내림차순</option>
        <option value="feeAsc">요금 낮은순</option>
        <option value="feeDesc">요금 높은순</option>
      </select>
    </div>
  );
}
