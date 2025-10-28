import React from "react";

export default function SearchBar({ value, onChange, placeholder = "주차장 이름/주소 검색" }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <input
        className="flex-1 border rounded px-3 py-2"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
