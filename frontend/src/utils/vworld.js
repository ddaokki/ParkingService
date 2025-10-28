// frontend/src/utils/vworld.js
// V-World JS API 로더 (버전 2.0; 키 누락/호환 문제 시에도 앱이 죽지 않도록 안전 처리)
export async function loadVWorld() {
  // 이미 로드됨
  if (window.vw?.ol3 || window.vworld?.ol3) return true;

  const key = process.env.REACT_APP_VWORLD_API_KEY;
  if (!key) return false; // 키 없으면 지도 비활성

  // 권장 로더 URL
  const src = `https://map.vworld.kr/js/vworldMap.js.do?version=2.0&apiKey=${encodeURIComponent(
    key
  )}`;

  // 중복 로드 방지
  if (document.querySelector(`script[src^="https://map.vworld.kr/js/vworldMap.js.do"]`)) {
    return new Promise((resolve) => {
      const ok = () => resolve(Boolean(window.vw?.ol3 || window.vworld?.ol3));
      setTimeout(ok, 800);
    });
  }

  await new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = resolve;
    s.onerror = resolve; // 실패해도 resolve해서 앱 전체 동작은 유지
    document.head.appendChild(s);
  });

  return Boolean(window.vw?.ol3 || window.vworld?.ol3);
}
