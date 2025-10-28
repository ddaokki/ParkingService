import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { handleLogin, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });

  const onSubmit = async (e) => {
    e.preventDefault();
    const ok = await handleLogin(form);
    if (ok) navigate("/"); else alert("로그인 실패");
  };

  return (
    <div className="max-w-sm mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">로그인</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="w-full border rounded px-3 py-2" placeholder="아이디"
          value={form.username} onChange={(e)=>setForm({...form, username:e.target.value})}/>
        <input className="w-full border rounded px-3 py-2" type="password" placeholder="비밀번호"
          value={form.password} onChange={(e)=>setForm({...form, password:e.target.value})}/>
        <button className="w-full border rounded px-3 py-2" disabled={loading}>
          {loading ? "처리 중…" : "로그인"}
        </button>
      </form>
    </div>
  );
}
