// items.js (구글시트 CSV 연동)
// 시트 컬럼 예시: id | cat | name | unit | price | active
// cat: 과일 / 야채 / 봉채소 / 생선 / 기타
// active: 1이면 사용, 0이면 숨김

(() => {
  // ✅ 네 구글시트 ID로 교체 (이미 맞으면 그대로)
  const SHEET_ID = "1MK7TvyILEJ4_YKw1TmY1Au4Z_ZkGbF7LeRMsI89sIbw";
  const GID = "0"; // 보통 첫 시트면 0
  const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${GID}`;

  const CACHE_KEY = "UMGANE_ITEMS_CACHE_V3";
  const CACHE_TIME_KEY = "UMGANE_ITEMS_CACHE_TIME_V3";
  const CACHE_TTL_MS = 60 * 1000; // 1분 캐시

  // CSV 파서 (간단/안전)
  function parseCSV(text) {
    const rows = [];
    let cur = "", inQ = false;
    const line = [];
    function pushCell() { line.push(cur); cur = ""; }
    function pushLine() { rows.push(line.splice(0, line.length)); }

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (ch === '"') {
        if (inQ && text[i + 1] === '"') { cur += '"'; i++; }
        else inQ = !inQ;
      } else if (ch === "," && !inQ) {
        pushCell();
      } else if ((ch === "\n" || ch === "\r") && !inQ) {
        if (ch === "\r" && text[i + 1] === "\n") i++;
        pushCell();
        // 빈 줄 제외
        if (rows.length === 0 || line.length > 1 || (line[0] && line[0].trim())) pushLine();
      } else {
        cur += ch;
      }
    }
    // last
    if (cur.length || line.length) {
      pushCell();
      pushLine();
    }
    return rows;
  }

  function normalizeHeader(h) {
    return (h || "").toString().trim().toLowerCase();
  }

  function toItem(obj) {
    const id = (obj.id || obj.ID || obj.Id || "").toString().trim();
    const cat = (obj.cat || obj.category || obj.CAT || "").toString().trim();
    const name = (obj.name || obj.item || obj.NAME || "").toString().trim();
    const unit = (obj.unit || obj.UNIT || "").toString().trim();
    const price = parseInt((obj.price || obj.PRICE || "0").toString().replace(/[^\d]/g, ""), 10) || 0;
    const activeRaw = (obj.active ?? obj.ACTIVE ?? "1").toString().trim();
    const active = activeRaw === "0" ? 0 : 1;

    if (!id || !name) return null;
    return { id, cat, name, unit, price, active };
  }

  async function fetchItems() {
    const res = await fetch(CSV_URL + `&t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error("CSV fetch failed: " + res.status);
    const text = await res.text();
    const table = parseCSV(text);

    if (!table || table.length < 2) throw new Error("CSV empty");

    const headers = table[0].map(normalizeHeader);
    const items = [];

    for (let r = 1; r < table.length; r++) {
      const row = table[r];
      if (!row || row.length === 0) continue;

      const obj = {};
      for (let c = 0; c < headers.length; c++) {
        const key = headers[c] || `col${c}`;
        obj[key] = (row[c] ?? "").toString().trim();
      }

      // 허용 헤더 매핑(조금 엉켜도 됨)
      const mapped = {
        id: obj.id || obj["상품id"] || obj["code"] || obj["코드"],
        cat: obj.cat || obj["카테고리"] || obj["대분류"],
        name: obj.name || obj["품목명"] || obj["상품명"] || obj["name"],
        unit: obj.unit || obj["단위"] || obj["구성"],
        price: obj.price || obj["가격"] || obj["판매가"],
        active: obj.active || obj["사용"] || obj["active"],
      };

      const it = toItem(mapped);
      if (it) items.push(it);
    }

    return items;
  }

  function emitLoaded(items) {
    window.dispatchEvent(new CustomEvent("items:loaded", { detail: items }));
  }
  function emitFailed() {
    window.dispatchEvent(new Event("items:failed"));
  }

  // 캐시 즉시 적용
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length) emitLoaded(parsed);
    }
  } catch (_) {}

  (async () => {
    try {
      const last = Number(sessionStorage.getItem(CACHE_TIME_KEY) || "0");
      const now = Date.now();
      if (now - last < CACHE_TTL_MS) return; // 최근에 가져왔으면 끝

      const items = await fetchItems();
      if (!items || !items.length) throw new Error("no items");

      sessionStorage.setItem(CACHE_KEY, JSON.stringify(items));
      sessionStorage.setItem(CACHE_TIME_KEY, String(now));

      emitLoaded(items);
    } catch (e) {
      console.warn("[items.js] load failed:", e);
      emitFailed();
    }
  })();
})();
