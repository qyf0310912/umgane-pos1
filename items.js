// 엄가네 품목 데이터 (대량 업로드용)
// cat: 과일 / 야채 / 잎채소 / 생선 / 기타
// unit: 개/봉/망/단/팩/송이/묶음 등
// pinned: true면 상단 "자주쓰는 품목"에 고정

window.ITEMS = [
  // ===== 과일 (자주쓰는 예시) =====
  { id:"apple",    cat:"과일", name:"사과",        unit:"개",  price:3000, pinned:true },
  { id:"pear",     cat:"과일", name:"배",          unit:"개",  price:3500, pinned:true },
  { id:"banana",   cat:"과일", name:"바나나",      unit:"송이", price:4000, pinned:true },
  { id:"tanger",   cat:"과일", name:"귤",          unit:"kg",  price:6000, pinned:true },
  { id:"straw",    cat:"과일", name:"딸기",        unit:"팩",  price:9000, pinned:true },

  // ===== 묶음판매(현장용 버튼) =====
  // 단감 3개 5천 / 7개 만원
  { id:"dgam_3",   cat:"과일", name:"단감(3개)",   unit:"묶음", price:5000, pinned:true },
  { id:"dgam_7",   cat:"과일", name:"단감(7개)",   unit:"묶음", price:10000, pinned:true },

  // 샤인 1송이 3천 / 3송이 6천 (예시)
  { id:"shine_1",  cat:"과일", name:"샤인(1송이)", unit:"묶음", price:3000, pinned:true },
  { id:"shine_3",  cat:"과일", name:"샤인(3송이)", unit:"묶음", price:6000, pinned:true },

  // ===== 야채 =====
  { id:"onion",    cat:"야채", name:"양파",        unit:"망",  price:8000, pinned:true },
  { id:"potato",   cat:"야채", name:"감자",        unit:"망",  price:7000, pinned:true },
  { id:"carrot",   cat:"야채", name:"당근",        unit:"봉",  price:6000, pinned:true },
  { id:"zuc",      cat:"야채", name:"애호박",      unit:"개",  price:1500, pinned:true },
  { id:"swtpot",   cat:"야채", name:"고구마",      unit:"kg",  price:6000, pinned:true },
  { id:"garlic",   cat:"야채", name:"마늘",        unit:"망",  price:10000 },
  { id:"cabb",     cat:"야채", name:"양배추",      unit:"통",  price:3500 },
  { id:"radish",   cat:"야채", name:"무",          unit:"개",  price:2500 },
  { id:"cucumber", cat:"야채", name:"오이",        unit:"개",  price:1200 },
  { id:"pepper",   cat:"야채", name:"고추",        unit:"봉",  price:4000 },

  // ===== 잎채소 =====
  { id:"kkae",     cat:"잎채소", name:"깻잎",      unit:"봉",  price:6000, pinned:true },
  { id:"sangchu",  cat:"잎채소", name:"상추",      unit:"봉",  price:5000, pinned:true },
  { id:"spin",     cat:"잎채소", name:"시금치",    unit:"봉",  price:4000 },
  { id:"ssukgat",  cat:"잎채소", name:"쑥갓",      unit:"봉",  price:4000 },

  // ===== 생선 =====
  { id:"mackerel", cat:"생선", name:"고등어",      unit:"마리", price:5000 },
  { id:"cutlass",  cat:"생선", name:"갈치",        unit:"마리", price:9000 },

  // ===== 기타 =====
  { id:"egg",      cat:"기타", name:"계란",        unit:"판",  price:7000, pinned:true },
  { id:"tofu",     cat:"기타", name:"두부",        unit:"모",  price:2000, pinned:true },
  { id:"sprout",   cat:"기타", name:"콩나물",      unit:"봉",  price:2000, pinned:true },
];
