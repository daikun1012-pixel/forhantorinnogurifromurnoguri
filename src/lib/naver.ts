// Minimal loader for the Naver Maps JS v3 SDK. We only need a handful of
// its APIs, so the global is typed loosely as `any`.

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    naver?: any;
  }
}

let loadPromise: Promise<any> | null = null;

export function loadNaverMaps(
  clientId: string,
  keyParam = "ncpClientId",
): Promise<any> {
  if (window.naver?.maps) return Promise.resolve(window.naver);
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?${keyParam}=${encodeURIComponent(
      clientId,
    )}`;
    script.async = true;
    script.onload = () => {
      if (window.naver?.maps) resolve(window.naver);
      else reject(new Error("네이버 지도를 불러오지 못했습니다"));
    };
    script.onerror = () => {
      loadPromise = null;
      reject(new Error("네이버 지도 스크립트 로드 실패"));
    };
    document.head.appendChild(script);
  });
  return loadPromise;
}
