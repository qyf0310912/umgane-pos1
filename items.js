// items.js (구글시트 연동 버전)
// - 구글시트의 id,cat,name,price,active 를 읽어서 window.ITEMS 생성
// - active=1 만 사용
// - 봉채소 -> 잎채소로 자동 변환(기존 UI 카테고리 유지용)
// - 네 기존 POS는 window.ITEMS만 쓰면 그대로 동작

(() => {
  const SHEET_ID = "1MK7TvyILEJ4_YKw1TmY1Au4Z_ZkGbF7LeRMsi89slbw";
  const GID = "0"; // 너가 올린 시트 gid=0
  const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${GID}`;

  const CACHE_KEY = "UMGANE_ITEMS_CACHE_V1";
  const CACHE_TIME_KEY = "UMGANE_ITEMS_CACHE_TIME_V1";
  const CACHE_TTL_MS = 60 * 1000; // 1분 캐시(너무 자주 새로고침 방지)

  // 기존 코드 호환: window.ITEMS는 항상 존재하게
  window.ITEMS = window.ITEMS || [];

  // 외부에서 수동 새로고침 가능하게 (버튼 연결용)
  window.reloadItemsFromSheet = async function reloadItemsFromSheet() {
    const items = await fetchItems();
    if (items && items.length) {
      window.ITEMS = items;
      // UI가 갱신 함수가 있으면 호출(있으면 자동 반영)
      if (typeof window.renderItems === "function") window.renderItems();
      if (typeof window.renderCatalog === "function") window.renderCatalog();
      // 없으면 페이지 새로고침 한 번으로 반영(안전)
      if (!window.__UMGANE_RENDER_HOOK_FOUND__) location.reload();
    }
  };

  // 1) 먼저 캐시가 있으면 즉시 보여주기(초기 로딩 빠르게)
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length) {
        window.ITEMS = parsed;
      }
    }
  } catch (_) {}

  // 2) 시트에서 최신 데이터 가져오기(백그라운드)
  (async () => {
    const last = Number(sessionStorage.getItem(CACHE_TIME_KEY) || "0");
    const now = Date.now();

    // 너무 잦은 fetch 방지(원하면 TTL 줄여도 됨)
    if (now - last < CACHE_TTL_MS) return;

    const items = await fetchItems();
    if (!items || !items.length) return;

    sessionStorage.setItem(CACHE_TIME_KEY, String(now));

    // 캐시/현재와 다르면 갱신
    const prevJson = sessionStorage.getItem(CACHE_KEY) || "";
    const nextJson = JSON.stringify(items);

    if (prevJson !== nextJson) {
      sessionStorage.setItem(CACHE_KEY, nextJson);
      window.ITEMS = items;

      // UI 갱신 훅이 있으면 즉시 호출, 없으면 1회 리로드로 반영
      const beforeCount = document.querySelectorAll("button, .btn, .item, .product").length;

      let hooked = false;
      if (typeof window.renderItems === "function") { window.renderItems(); hooked = true; }
      if (typeof window.renderCatalog === "function") { window.renderCatalog(); hooked = true; }

      window.__UMGANE_RENDER_HOOK_FOUND__ = hooked;

      // 훅이 없고, 아직 화면이 비어있으면 리로드 한 번
      if (!hooked) {
        const afterCount = document.querySelectorAll("button, .btn, .item, .product").length;
        const alreadyReloaded = sessionStorage.getItem("__UMGANE_RELOADED_ONCE__") === "1";
        if (!alreadyReloaded && afterCount === beforeCount) {
          sessionStorage.setItem("__UMGANE_RELOADED_ONCE__", "1");
          location.reload();
        }
      }
    }
  })();

  async function fetchItems() {
    try {
      const res = await fetch(CSV_URL + `&t=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) throw new Error("CSV fetch failed: " + res.status);

      const text = await res.text();
      const rows = parseCSV(text);

      // 헤더 찾기
      const header = rows[0]?.map(s => (s || "").trim()) || [];
      const idx = (col) => header.findIndex(h => h === col);

      const iId = idx("id");
      const iCat = idx("cat");
      const iName = idx("name");
      const iPrice = idx("price");
      const iActive = idx("active");

      if ([iId, iCat, iName, iPrice, iActive].some(v => v < 0)) {
        // 너 시트가 A열부터 id/cat/name/price/active 맞으면 이 에러 안 남
        console.warn("헤더가 예상과 다름. 현재 헤더:", header);
      }

      const out = [];
      for (let r = 1; r < rows.length; r++) {
        const row = rows[r];
        if (!row || row.length === 0) continue;

        const active = (row[iActive] ?? "").toString().trim();
        if (active !== "1") continue;

        let cat = (row[iCat] ?? "").toString().trim();
        const name = (row[iName] ?? "").toString().trim();
        let priceRaw = (row[iPrice] ?? "").toString().trim();

        // 카테고리 호환(네 기존은 "잎채소"를 쓰고 있어서)
        if (cat === "봉채소") cat = "잎채소";

        // 가격 숫자로 변환 (5,000 / ₩5,000 / 5000.00 다 처리)
        priceRaw = priceRaw.replace(/[₩,\s]/g, "");
        const price = Math.round(Number(priceRaw) || 0);

        // 빈 줄 스킵
        if (!name || !cat || !price) continue;

        out.push({
          cat,
          name,
          unit: "개",
          price
        });
      }

      return out;
    } catch (e) {
      console.warn("시트 로딩 실패(기존 ITEMS/캐시 유지):", e);
      return window.ITEMS || [];
    }
  }

  // CSV 파서(따옴표/콤마 처리)
  function parseCSV(text) {
    const rows = [];
    let row = [];
    let cur = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      const next = text[i + 1];

      if (c === '"' && inQuotes && next === '"') {
        cur += '"';
        i++;
        continue;
      }

      if (c === '"') {
        inQuotes = !inQuotes;
        continue;
      }

      if (!inQuotes && (c === ",")) {
        row.push(cur);
        cur = "";
        continue;
      }

      if (!inQuotes && (c === "\n" || c === "\r")) {
        if (c === "\r" && next === "\n") i++;
        row.push(cur);
        rows.push(row);
        row = [];
        cur = "";
        continue;
      }

      cur += c;
    }

    // 마지막
    if (cur.length || row.length) {
      row.push(cur);
      rows.push(row);
    }

    // 완전 빈 줄 제거
    return rows.filter(r => r.some(v => String(v || "").trim() !== ""));
  }
})();
