// ✅ 콤마/따옴표 안전 CSV 파서
function parseCSV(text) {
  const rows = [];
  let cur = "", inQ = false;
  let row = [];
  function pushCell(){ row.push(cur); cur=""; }
  function pushRow(){ rows.push(row); row=[]; }

  for (let i=0;i<text.length;i++){
    const ch=text[i];
    if(ch === '"'){
      if(inQ && text[i+1] === '"'){ cur+='"'; i++; }
      else inQ = !inQ;
    } else if(ch === "," && !inQ){
      pushCell();
    } else if((ch === "\n" || ch === "\r") && !inQ){
      if(ch === "\r" && text[i+1] === "\n") i++;
      pushCell();
      // 빈줄 제거
      if(row.length>1 || (row[0] && row[0].trim())) pushRow();
    } else {
      cur += ch;
    }
  }
  if(cur.length || row.length){ pushCell(); pushRow(); }
  return rows;
}

async function loadSheetItems(){
  const res = await fetch(CSV_URL + "&t=" + Date.now(), { cache:"no-store" });
  const text = await res.text();

  const table = parseCSV(text);
  if(!table || table.length < 2) return [];

  const head = table[0].map(h => (h||"").trim().toLowerCase());
  const idx = (k) => head.indexOf(k);

  const out = [];
  for(let i=1;i<table.length;i++){
    const r = table[i];
    if(!r || !r.length) continue;

    const active = (r[idx("active")] ?? "1").toString().trim();
    if(active === "0") continue;

    const id = (r[idx("id")] ?? "").toString().trim();
    const cat = (r[idx("cat")] ?? "기타").toString().trim();
    const name = (r[idx("name")] ?? "").toString().trim();
    const priceRaw = (r[idx("price")] ?? "0").toString();
    const price = Number(priceRaw.replace(/[^\d]/g,"")) || 0;

    if(!id || !name) continue;

    out.push({ id, cat, name, price, pinned:false, used:0 });
  }
  return out;
}
