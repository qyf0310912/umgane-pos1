// items.js (구글시트 연동: id 포함 + active=1만)
// window.ITEMS = [{id,cat,name,unit,price}...]

(() => {
  const SHEET_ID = "1MK7TvyILEJ4_YKw1TmY1Au4Z_ZkGbF7LeRMsi89slbw";
  const GID = "0";
  const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${GID}`;

  const CACHE_KEY = "UMGANE_ITEMS_CACHE_V2";
  const CACHE_TIME_KEY = "UMGANE_ITEMS_CACHE_TIME_V2";
  const CACHE_TTL_MS = 60 * 1000;

  window.ITEMS = window.ITEMS || [];

  // 캐시 즉시 적용
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) window.ITEMS = parsed;
    }
  } catch (_) {}

  // 외부에서 강제 새로고침 가능
  window.reloadItemsFromSheet = async function () {
    const items = await fetchItems();
    if (items && items.length) {
      window.ITEMS = items;
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(items));
      sessionStorage.setItem(CACHE_TIME_KEY, String(Date.now()));
      location.reload(); // 확실하게 반영
    }
  };

  (async () => {
    const last = Number(sessionStorage.getItem(CACHE_TIME_KEY) || "0");
    const now = Date.now();
    if (now - last < CACHE_TTL_MS) return;

    const items = await fetchItems();
    if (!items || !items.length) return;

    const nextJson = JSON.stringify(items);
    const prevJson = sessionStorage.getItem(CACHE_KEY) || "";

    sessionStorage.setItem(CACHE_TIME_KEY, String(now));

    if (prevJson !== nextJson) {
      sessionStorage.setItem(CACHE_KEY, nextJson);
      window.ITEMS = items;
      // 화면이 items.js 직접 훅을 안 쓰므로, 1회 리로드로 반영
      location.reload();
    }
  })();

  async function fetchItems() {
    try {
      const res = await fetch(CSV_URL + `&t=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) throw new Error("CSV fetch failed: " + res.status);

      const text = await res.text();
      const rows = parseCSV(text);
      if (!rows.length) return [];

      const header = rows[0].map(s => (s || "").trim());
      const idx = (col) => header.findIndex(h => h === col);

      const iId = idx("id");
      const iCat = idx("cat");
      const iName = idx("name");
      const iPrice = idx("price");
      const iActive = idx("active");

      const out = [];
      for (let r = 1; r < rows.length; r++) {
        const row = rows[r];
        if (!row || !row.length) continue;

        const active = String(row[iActive] ?? "").trim();
        if (active !== "1") continue;

        let id = String(row[iId] ?? "").trim();
        let cat = String(row[iCat] ?? "").trim();
        const name = String(row[iName] ?? "").trim();
        let priceRaw = String(row[iPrice] ?? "").trim();

        // 카테고리 호환: 봉채소 -> 잎채소
        if (cat === "봉채소") cat = "잎채소";

        priceRaw = priceRaw.replace(/[₩,\s]/g, "");
        const price = Math.round(Number(priceRaw) || 0);

        if (!id) {
          // 혹시 id 비어있으면 자동 생성(권장X지만 안전장치)
          id = (cat + "_" + name).replace(/\s/g, "");
        }

        if (!cat || !name || !price) continue;

        out.push({ id, cat, name, unit: "개", price });
      }

      return out;
    } catch (e) {
      console.warn("시트 로딩 실패:", e);
      return window.ITEMS || [];
    }
  }

  // 간단 CSV 파서
  function parseCSV(text) {
    const rows = [];
    let row = [];
    let cur = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      const next = text[i + 1];

      if (c === '"' && inQuotes && next === '"') { cur += '"'; i++; continue; }
      if (c === '"') { inQuotes = !inQuotes; continue; }

      if (!inQuotes && c === ",") { row.push(cur); cur = ""; continue; }

      if (!inQuotes && (c === "\n" || c === "\r")) {
        if (c === "\r" && next === "\n") i++;
        row.push(cur); rows.push(row);
        row = []; cur = "";
        continue;
      }

      cur += c;
    }
    if (cur.length || row.length) { row.push(cur); rows.push(row); }

    return rows.filter(r => r.some(v => String(v || "").trim() !== ""));
  }
})();
