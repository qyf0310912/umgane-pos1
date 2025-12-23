// items.js — 구글시트 연동 + 자동정렬 전용

(() => {
  const SHEET_ID = "1MK7TvyILEJ4_YKw1TmY1Au4Z_ZkGbF7LeRMsi89slbw";
  const GID = "0";
  const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${GID}`;

  window.ITEMS = [];

  async function fetchItems() {
    const res = await fetch(CSV_URL + "&t=" + Date.now());
    const text = await res.text();
    const rows = text.split("\n").slice(1);

    return rows
      .map(r => r.split(","))
      .map(c => ({
        id: c[0],
        cat: c[1],
        name: c[2],
        price: Number(c[3]),
        pinned: c[4] === "1",
        active: c[5] === "1",
        usage: Number(c[6] || 0),
        last: Number(c[7] || 0),
      }))
      .filter(i => i.active);
  }

  fetchItems().then(items => {
    window.ITEMS = items;
    document.dispatchEvent(new Event("ITEMS_READY"));
  });
})();
