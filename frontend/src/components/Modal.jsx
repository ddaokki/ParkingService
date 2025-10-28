import React from "react";

export default function Modal({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl shadow-lg">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold">{title}</h3>
          <button className="text-sm px-2 py-1 border rounded" onClick={onClose}>닫기</button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
