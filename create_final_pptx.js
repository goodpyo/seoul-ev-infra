const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.title = "서울시 전기차 충전 인프라 현황 분석";

// ── 색상 팔레트 ──
const C = {
  navy:    "1E3A8A",
  blue:    "1D4ED8",
  cyan:    "22D3EE",
  cyanL:   "CFFAFE",
  white:   "FFFFFF",
  offwhite:"F8FAFC",
  slate:   "64748B",
  slateL:  "E2E8F0",
  dark:    "0F172A",
  red:     "DC2626",
  orange:  "EA580C",
  yellow:  "D97706",
  green:   "16A34A",
  gray:    "94A3B8",
};

const makeShadow = () => ({ type: "outer", blur: 8, offset: 3, angle: 135, color: "000000", opacity: 0.12 });

// ── 공통 헬퍼: 상단 컬러 바 ──
function addTopBar(slide, title, subtitle) {
  slide.background = { color: C.offwhite };
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 1.1,
    fill: { color: C.navy }, line: { color: C.navy }
  });
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 1.1, w: 10, h: 0.06,
    fill: { color: C.cyan }, line: { color: C.cyan }
  });
  slide.addText(title, {
    x: 0.4, y: 0.15, w: 7.5, h: 0.7,
    fontSize: 22, bold: true, color: C.white, fontFace: "Arial",
    margin: 0
  });
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.4, y: 0.78, w: 9, h: 0.32,
      fontSize: 10, color: C.cyanL, fontFace: "Arial", margin: 0
    });
  }
  // 슬라이드 번호 영역 (우상단)
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 8.8, y: 0.1, w: 1.0, h: 0.5,
    fill: { color: C.blue }, line: { color: C.blue }
  });
}

// ── 공통 헬퍼: 카드 ──
function addCard(slide, x, y, w, h, opts = {}) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y, w, h,
    fill: { color: opts.fill || C.white },
    line: { color: opts.border || C.slateL, width: 1 },
    shadow: makeShadow()
  });
  if (opts.accent) {
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 0.07, h,
      fill: { color: opts.accent }, line: { color: opts.accent }
    });
  }
}

// ── 공통 헬퍼: KPI 박스 ──
function addKPI(slide, x, y, w, h, num, label, color) {
  addCard(slide, x, y, w, h, { accent: color });
  slide.addText(num, {
    x: x + 0.1, y: y + 0.12, w: w - 0.15, h: 0.65,
    fontSize: 24, bold: true, color: color, align: "center", fontFace: "Arial", margin: 0
  });
  slide.addText(label, {
    x: x + 0.1, y: y + 0.78, w: w - 0.15, h: 0.28,
    fontSize: 10, color: C.slate, align: "center", fontFace: "Arial", margin: 0
  });
}

// ══════════════════════════════════════════════════════════
// SLIDE 1 — 표지
// ══════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.dark };

  // 배경 장식
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 3.5, h: 5.625,
    fill: { color: C.navy }, line: { color: C.navy }
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 3.5, y: 0, w: 0.08, h: 5.625,
    fill: { color: C.cyan }, line: { color: C.cyan }
  });

  // ⚡ 아이콘 대체 - 큰 텍스트 심볼
  s.addText("⚡", {
    x: 0.4, y: 0.5, w: 2.5, h: 1.2,
    fontSize: 64, align: "center", margin: 0
  });

  // 좌측 부제 라벨
  s.addText("AI 프로그래밍  |  최종 발표", {
    x: 0.3, y: 1.85, w: 3.0, h: 0.3,
    fontSize: 9, color: C.cyanL, align: "center", fontFace: "Arial", margin: 0
  });
  s.addShape(pres.shapes.LINE, {
    x: 0.5, y: 2.2, w: 2.5, h: 0,
    line: { color: C.cyan, width: 1 }
  });
  s.addText("팀 프로젝트", {
    x: 0.3, y: 2.3, w: 3.0, h: 0.3,
    fontSize: 9, color: C.gray, align: "center", fontFace: "Arial", margin: 0
  });
  s.addText("2026년 6월", {
    x: 0.3, y: 4.9, w: 3.0, h: 0.3,
    fontSize: 9, color: C.gray, align: "center", fontFace: "Arial", margin: 0
  });

  // 우측 메인 타이틀
  s.addText("서울시", {
    x: 3.9, y: 0.7, w: 5.8, h: 0.7,
    fontSize: 36, bold: true, color: C.white, fontFace: "Arial", margin: 0
  });
  s.addText("전기차 충전 인프라", {
    x: 3.9, y: 1.4, w: 5.8, h: 0.7,
    fontSize: 36, bold: true, color: C.white, fontFace: "Arial", margin: 0
  });
  s.addText("현황 분석", {
    x: 3.9, y: 2.1, w: 5.8, h: 0.7,
    fontSize: 36, bold: true, color: C.cyan, fontFace: "Arial", margin: 0
  });
  s.addShape(pres.shapes.LINE, {
    x: 3.9, y: 2.95, w: 5.5, h: 0,
    line: { color: C.cyan, width: 1.5 }
  });
  s.addText("전기차 등록 현황 & 공용 충전소 설치현황 분석\n행정동 단위 인프라 사각지대 도출 및 정책 시사점", {
    x: 3.9, y: 3.1, w: 5.8, h: 0.8,
    fontSize: 12, color: C.gray, fontFace: "Arial", margin: 0
  });

  // 데이터 기준
  s.addText("데이터 기준: 전기차 등록(2026.04) · 충전소 설치현황(2026.05.12)", {
    x: 3.9, y: 5.1, w: 5.8, h: 0.3,
    fontSize: 9, color: C.gray, fontFace: "Arial", margin: 0
  });
}

// ══════════════════════════════════════════════════════════
// SLIDE 2 — 목차
// ══════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  addTopBar(s, "목차", "Contents");

  const items = [
    ["01", "분석 배경 및 문제의식",    "왜 충전 인프라를 분석했나?"],
    ["02", "데이터 출처 및 분석 방법", "어떤 데이터로, 어떻게 분석했나?"],
    ["03", "서울 전체 현황",           "총량 지표 요약"],
    ["04", "평균의 함정",              "자치구 vs 행정동 단위 비교"],
    ["05", "인프라 부족 지역 TOP 15",  "사각지대 발굴 결과"],
    ["06", "앱 구현 및 기술 스택",     "대시보드 데모 및 구현 과정"],
    ["07", "한계 및 정책 시사점",      "결론 및 제언"],
  ];

  items.forEach(([num, title, sub], i) => {
    const x = i < 4 ? 0.35 : 5.2;
    const y = 1.35 + (i < 4 ? i : i - 4) * 1.0;
    const w = 4.55;

    addCard(s, x, y, w, 0.78, { accent: C.blue });
    s.addText(num, {
      x: x + 0.15, y: y + 0.05, w: 0.55, h: 0.65,
      fontSize: 20, bold: true, color: C.blue, fontFace: "Arial", margin: 0
    });
    s.addText(title, {
      x: x + 0.72, y: y + 0.05, w: w - 0.82, h: 0.32,
      fontSize: 12, bold: true, color: C.dark, fontFace: "Arial", margin: 0
    });
    s.addText(sub, {
      x: x + 0.72, y: y + 0.38, w: w - 0.82, h: 0.28,
      fontSize: 9, color: C.slate, fontFace: "Arial", margin: 0
    });
  });
}

// ══════════════════════════════════════════════════════════
// SLIDE 3 — 분석 배경
// ══════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  addTopBar(s, "분석 배경 및 문제의식", "01 · Background");

  // 메인 질문
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.35, y: 1.3, w: 9.3, h: 0.85,
    fill: { color: C.navy }, line: { color: C.navy }, shadow: makeShadow()
  });
  s.addText("💡  \"전기차는 늘고 있는데, 충전은 편한가? 사각지대는 없는가?\"", {
    x: 0.5, y: 1.38, w: 9.0, h: 0.65,
    fontSize: 15, bold: true, color: C.white, fontFace: "Arial", margin: 0
  });

  const cards = [
    ["📈", "전기차 급증", "서울 전기차 등록 111,761대\n매년 가파른 증가세"],
    ["🌱", "탄소중립 정책", "2030년 전기차 450만 대 목표\n인프라 확충 시급"],
    ["😰", "충전 불안", "주변 충전소 위치 불확실\n대기·고장 경험 빈번"],
    ["🔍", "사각지대 의심", "구 단위 통계로는 부족 여부\n파악 불가"],
  ];

  cards.forEach(([icon, title, desc], i) => {
    const x = 0.35 + i * 2.35;
    addCard(s, x, 2.35, 2.2, 2.8, { accent: C.cyan });
    s.addText(icon, { x, y: 2.45, w: 2.2, h: 0.55, fontSize: 26, align: "center", margin: 0 });
    s.addText(title, {
      x: x + 0.12, y: 3.05, w: 1.96, h: 0.35,
      fontSize: 12, bold: true, color: C.navy, align: "center", fontFace: "Arial", margin: 0
    });
    s.addText(desc, {
      x: x + 0.12, y: 3.45, w: 1.96, h: 0.6,
      fontSize: 9.5, color: C.slate, align: "center", fontFace: "Arial", margin: 0
    });
  });

  s.addText("→ 행정동 단위로 공용 충전 인프라 사각지대를 데이터로 직접 규명", {
    x: 0.35, y: 5.2, w: 9.3, h: 0.28,
    fontSize: 11, bold: true, color: C.blue, fontFace: "Arial", margin: 0
  });
}

// ══════════════════════════════════════════════════════════
// SLIDE 4 — 데이터 출처 & 분석 방법
// ══════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  addTopBar(s, "데이터 출처 및 분석 방법", "02 · Data & Methodology");

  // 왼쪽: 데이터
  s.addText("데이터 출처", {
    x: 0.35, y: 1.3, w: 4.4, h: 0.35,
    fontSize: 13, bold: true, color: C.navy, fontFace: "Arial", margin: 0
  });

  const dataSrc = [
    ["전기차 등록 현황", "자동차관리정보시스템 (국토교통부, 2026.04)", "행정동별 전기차 대수"],
    ["충전소 설치현황", "한국환경공단 API getChargerInfo (2026.05.12)", "GPS·급속/완속 기수"],
    ["행정동 경계", "행정안전부 행정동 GeoJSON", "행정동 폴리곤 매핑"],
  ];

  dataSrc.forEach(([title, src, use], i) => {
    const y = 1.75 + i * 0.88;
    addCard(s, 0.35, y, 4.4, 0.76, { accent: C.blue });
    s.addText(title, {
      x: 0.5, y: y + 0.04, w: 4.1, h: 0.28,
      fontSize: 10.5, bold: true, color: C.dark, fontFace: "Arial", margin: 0
    });
    s.addText(`출처: ${src}`, {
      x: 0.5, y: y + 0.32, w: 4.1, h: 0.2,
      fontSize: 8.5, color: C.slate, fontFace: "Arial", margin: 0
    });
    s.addText(`→ ${use}`, {
      x: 0.5, y: y + 0.52, w: 4.1, h: 0.18,
      fontSize: 8, color: C.blue, fontFace: "Arial", margin: 0
    });
  });

  // 오른쪽: 분석 흐름
  s.addText("분석 프로세스", {
    x: 5.0, y: 1.3, w: 4.65, h: 0.35,
    fontSize: 13, bold: true, color: C.navy, fontFace: "Arial", margin: 0
  });

  const steps = [
    ["01", "데이터 수집", "API + Excel 파싱"],
    ["02", "행정동 매핑", "GPS → 행정동 폴리곤 매핑"],
    ["03", "지수 산출", "부족지수 = 전기차 ÷ 충전기 (IEA 표준 지표 방식)"],
    ["04", "검증", "GPS 실측 point-in-polygon 대조"],
    ["05", "시각화", "Streamlit 대시보드 구현"],
  ];

  steps.forEach(([num, title, desc], i) => {
    const y = 1.72 + i * 0.72;
    s.addShape(pres.shapes.RECTANGLE, {
      x: 5.0, y, w: 0.45, h: 0.55,
      fill: { color: C.navy }, line: { color: C.navy }
    });
    s.addText(num, {
      x: 5.0, y: y + 0.06, w: 0.45, h: 0.42,
      fontSize: 11, bold: true, color: C.white, align: "center", fontFace: "Arial", margin: 0
    });
    s.addText(title, {
      x: 5.55, y: y + 0.02, w: 4.0, h: 0.28,
      fontSize: 11, bold: true, color: C.dark, fontFace: "Arial", margin: 0
    });
    s.addText(desc, {
      x: 5.55, y: y + 0.28, w: 4.0, h: 0.22,
      fontSize: 9, color: C.slate, fontFace: "Arial", margin: 0
    });
    if (i < 4) {
      s.addShape(pres.shapes.LINE, {
        x: 5.22, y: y + 0.55, w: 0, h: 0.17,
        line: { color: C.cyan, width: 1.5 }
      });
    }
  });
}

// ══════════════════════════════════════════════════════════
// SLIDE 5 — 서울 전체 현황
// ══════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  addTopBar(s, "서울 전체 현황", "03 · Overview");

  // 5개 KPI
  const kpis = [
    ["111,761대", "전기차 등록", C.navy],
    ["69,770기",  "충전기 총계", C.blue],
    ["5,532기",   "급속 충전기", C.cyan],
    ["64,238기",  "완속 충전기", C.slate],
    ["15개 동",   "인프라 부족 동", C.red],
  ];

  kpis.forEach(([num, label, color], i) => {
    addKPI(s, 0.3 + i * 1.9, 1.25, 1.75, 1.18, num, label, color);
  });

  // 핵심 인사이트
  s.addText("핵심 인사이트", {
    x: 0.35, y: 2.62, w: 9.3, h: 0.35,
    fontSize: 13, bold: true, color: C.navy, fontFace: "Arial", margin: 0
  });

  const insights = [
    [C.green,  "총량 충분", "충전기 1기당 전기차 1.6대 — 절대 총량은 충분한 수준"],
    [C.orange, "편중 문제", "완속 92.1%(64,238기) vs 급속 7.9%(5,532기) — 급속 절대 부족"],
    [C.red,    "사각지대", "행정동 단위 분석 시 15개 동(3.5%)에서 인프라 부족 확인"],
  ];

  insights.forEach(([color, title, desc], i) => {
    const y = 3.05 + i * 0.72;
    addCard(s, 0.35, y, 9.3, 0.6, { accent: color });
    s.addText(title, {
      x: 0.55, y: y + 0.07, w: 1.8, h: 0.42,
      fontSize: 11, bold: true, color, fontFace: "Arial", margin: 0
    });
    s.addText(desc, {
      x: 2.4, y: y + 0.1, w: 7.0, h: 0.38,
      fontSize: 11, color: C.dark, fontFace: "Arial", margin: 0
    });
  });
}

// ══════════════════════════════════════════════════════════
// SLIDE 6 — 평균의 함정
// ══════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  addTopBar(s, "평균의 함정", "04 · The Aggregation Problem");

  // 중앙 화살표 메시지
  s.addShape(pres.shapes.RECTANGLE, {
    x: 3.3, y: 1.25, w: 3.4, h: 0.7,
    fill: { color: C.navy }, line: { color: C.navy }, shadow: makeShadow()
  });
  s.addText("📊 분석 단위에 따라 결론이 뒤집힌다", {
    x: 3.3, y: 1.3, w: 3.4, h: 0.6,
    fontSize: 10.5, bold: true, color: C.white, align: "center", fontFace: "Arial", margin: 0
  });

  // 왼쪽: 자치구 단위
  addCard(s, 0.3, 2.1, 4.3, 3.25, { accent: C.green });
  s.addText("자치구 단위", {
    x: 0.5, y: 2.18, w: 3.9, h: 0.38,
    fontSize: 14, bold: true, color: C.green, fontFace: "Arial", margin: 0
  });
  s.addText("부족지수 1.1 ~ 2.8", {
    x: 0.5, y: 2.58, w: 3.9, h: 0.32,
    fontSize: 11.5, color: C.dark, fontFace: "Arial", margin: 0
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 3.0, w: 3.7, h: 0.55,
    fill: { color: C.green }, line: { color: C.green }
  });
  s.addText("25개 구 모두 '충분'", {
    x: 0.5, y: 3.04, w: 3.7, h: 0.47,
    fontSize: 16, bold: true, color: C.white, align: "center", fontFace: "Arial", margin: 0
  });
  s.addText([
    { text: "→ 지도만 보면 ", options: { breakLine: false } },
    { text: '"서울에 문제 없음"', options: { bold: true, breakLine: false } },
    { text: "으로 오해", options: {} }
  ], {
    x: 0.5, y: 3.65, w: 3.9, h: 0.35,
    fontSize: 10, color: C.slate, fontFace: "Arial", margin: 0
  });
  s.addText("예) 강남구 부족지수 2.8 → '충분'\n    하지만 개포1동은 16.8 → '부족'", {
    x: 0.5, y: 4.1, w: 3.9, h: 0.6,
    fontSize: 9.5, color: C.slate, fontFace: "Arial", margin: 0
  });

  // 오른쪽: 행정동 단위
  addCard(s, 5.4, 2.1, 4.3, 3.25, { accent: C.red });
  s.addText("행정동 단위 (427개 동)", {
    x: 5.6, y: 2.18, w: 3.9, h: 0.38,
    fontSize: 14, bold: true, color: C.red, fontFace: "Arial", margin: 0
  });

  const statusData = [
    ["충분", "373개", "87.4%", C.green],
    ["보통",  "38개",  "8.9%", C.yellow],
    ["부족",  "13개",  "3.0%", C.orange],
    ["매우부족", "2개",  "0.5%", C.red],
  ];
  statusData.forEach(([label, count, pct, color], i) => {
    const y = 2.62 + i * 0.58;
    s.addShape(pres.shapes.RECTANGLE, {
      x: 5.6, y, w: 0.9, h: 0.42,
      fill: { color }, line: { color }
    });
    s.addText(label, {
      x: 5.6, y: y + 0.06, w: 0.9, h: 0.3,
      fontSize: 9, bold: true, color: C.white, align: "center", fontFace: "Arial", margin: 0
    });
    s.addText(count, {
      x: 6.6, y: y + 0.06, w: 1.0, h: 0.3,
      fontSize: 12, bold: true, color, fontFace: "Arial", margin: 0
    });
    s.addText(pct, {
      x: 7.7, y: y + 0.06, w: 1.8, h: 0.3,
      fontSize: 11, color: C.slate, fontFace: "Arial", margin: 0
    });
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.6, y: 4.98, w: 3.7, h: 0.28,
    fill: { color: C.red }, line: { color: C.red }
  });
  s.addText("부족 이상 = 15개 동 (3.5%) 사각지대 발견!", {
    x: 5.6, y: 4.99, w: 3.7, h: 0.26,
    fontSize: 10, bold: true, color: C.white, align: "center", fontFace: "Arial", margin: 0
  });
}

// ══════════════════════════════════════════════════════════
// SLIDE 7 — 부족 동 TOP 16
// ══════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  addTopBar(s, "인프라 부족 행정동 TOP 15", "05 · Shortage Hotspots");

  const data = [
    ["1",  "강동구", "둔촌1동",   "37.5", "600",   "16",  C.red,    "⚠️ 주의"],
    ["2",  "광진구", "중곡1동",   "20.2", "101",   "5",   C.red,    "✅ 확실"],
    ["3",  "강남구", "개포1동",   "16.8", "572",   "34",  C.orange, "✅ 확실"],
    ["4",  "중랑구", "망우3동",   "16.7", "167",   "10",  C.orange, "✅ 확실"],
    ["5",  "송파구", "잠실4동",   "14.5", "521",   "36",  C.orange, "✅ 확실"],
    ["6",  "종로구", "부암동",    "13.7", "96",    "7",   C.orange, "✅ 확실"],
    ["7",  "강서구", "화곡본동",  "13.5", "149",   "11",  C.orange, "✅ 확실"],
    ["8",  "강남구", "대치1동",   "12.2", "3,428", "281", C.orange, "✅ 확실"],
    ["9",  "광진구", "중곡2동",   "11.1", "100",   "9",   C.orange, "✅ 확실"],
    ["10", "광진구", "중곡4동",   "10.9", "152",   "14",  C.orange, "✅ 확실"],
    ["11", "관악구", "보라매동",  "10.8", "258",   "24",  C.orange, "✅ 확실"],
    ["12", "금천구", "독산4동",   "17.5", "70",    "4",   C.yellow, "⚠️ 보통가능"],
    ["13", "양천구", "신월6동",   "12.3", "308",   "25",  C.yellow, "⚠️ 보통가능"],
    ["14", "서초구", "반포본동",  "12.1", "145",   "12",  C.yellow, "⚠️ 보통가능"],
    ["15", "용산구", "용산2가동", "11.2", "56",    "5",   C.yellow, "⚠️ 충분가능"],
  ];

  // 헤더
  const hdr = [["순위","0.4"],["자치구","1.1"],["행정동","1.5"],["부족지수","1.9"],["전기차","2.6"],["충전기","3.2"],["신뢰도","3.7"]];
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.3, y: 1.22, w: 9.4, h: 0.32,
    fill: { color: C.navy }, line: { color: C.navy }
  });
  hdr.forEach(([label, x]) => {
    s.addText(label, {
      x: parseFloat(x), y: 1.24, w: 0.8, h: 0.28,
      fontSize: 8.5, bold: true, color: C.white, fontFace: "Arial", margin: 0
    });
  });

  data.forEach(([rank, gu, dong, idx, ev, charger, color, trust], i) => {
    const y = 1.56 + i * 0.258;
    const bg = i % 2 === 0 ? "FFFFFF" : "F8FAFC";
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.3, y, w: 9.4, h: 0.25,
      fill: { color: bg }, line: { color: C.slateL, width: 0.5 }
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.3, y, w: 0.07, h: 0.25,
      fill: { color }, line: { color }
    });
    const cols = [[rank,"0.4"],[gu,"1.1"],[dong,"1.5"],[idx,"1.9"],[ev,"2.6"],[charger,"3.2"],[trust,"3.7"]];
    cols.forEach(([val, x]) => {
      const isIdx = x === "1.9";
      s.addText(val, {
        x: parseFloat(x), y: y + 0.03, w: 0.82, h: 0.2,
        fontSize: 8, bold: isIdx, color: isIdx ? color : C.dark, fontFace: "Arial", margin: 0
      });
    });
  });

  s.addText("★ 대치1동: 전기차 3,428대로 절대 수요 최대 (영향 차량 수 1위)   ★ 중곡1동: 급속 0기, 공공 충전 사각지대 확실   ★ 둔촌1동: 올림픽파크포레온 전용 충전기 별도 존재 가능 (공용 기준)", {
    x: 0.3, y: 5.38, w: 9.4, h: 0.2,
    fontSize: 7.5, color: C.slate, fontFace: "Arial", margin: 0
  });
}

// ══════════════════════════════════════════════════════════
// SLIDE 8 — 사례 비교 (둔촌1동 vs 중곡1동)
// ══════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  addTopBar(s, "사각지대 사례 비교", "05-1 · Case Study");

  s.addText("같은 '매우 부족'이지만, 성격이 다르다", {
    x: 0.35, y: 1.25, w: 9.3, h: 0.38,
    fontSize: 14, bold: true, color: C.navy, fontFace: "Arial", margin: 0
  });

  // 둔촌1동
  addCard(s, 0.3, 1.75, 4.45, 3.5, { accent: C.orange });
  s.addText("🏢 강동구 둔촌1동", {
    x: 0.5, y: 1.82, w: 4.1, h: 0.38,
    fontSize: 13, bold: true, color: C.orange, fontFace: "Arial", margin: 0
  });
  s.addText("1위 · 부족지수 37.5", {
    x: 0.5, y: 2.2, w: 4.1, h: 0.3,
    fontSize: 10, color: C.slate, fontFace: "Arial", margin: 0
  });
  const d1 = [["전기차","600대"],["공용 충전기","16기"],["급속","10기"],["완속","6기"]];
  d1.forEach(([k, v], i) => {
    s.addText(`${k}`, { x: 0.5, y: 2.58 + i * 0.38, w: 1.8, h: 0.3, fontSize: 10, color: C.slate, fontFace: "Arial", margin: 0 });
    s.addText(v, { x: 2.35, y: 2.58 + i * 0.38, w: 2.0, h: 0.3, fontSize: 10, bold: true, color: C.dark, fontFace: "Arial", margin: 0 });
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 4.22, w: 4.1, h: 0.72,
    fill: { color: "FFF7ED" }, line: { color: C.orange }
  });
  s.addText("⚠️ 해석 주의: 올림픽파크포레온(12,032세대)\n단지 내 전용 충전기 별도 존재 가능\n→ '공공 인프라 부족'이지 절대적 부족은 아님", {
    x: 0.6, y: 4.28, w: 3.9, h: 0.62,
    fontSize: 8.5, color: C.orange, fontFace: "Arial", margin: 0
  });

  // 중곡1동
  addCard(s, 5.25, 1.75, 4.45, 3.5, { accent: C.red });
  s.addText("🏘️ 광진구 중곡1동", {
    x: 5.45, y: 1.82, w: 4.1, h: 0.38,
    fontSize: 13, bold: true, color: C.red, fontFace: "Arial", margin: 0
  });
  s.addText("2위 · 부족지수 20.2", {
    x: 5.45, y: 2.2, w: 4.1, h: 0.3,
    fontSize: 10, color: C.slate, fontFace: "Arial", margin: 0
  });
  const d2 = [["전기차","101대"],["공용 충전기","5기"],["급속","0기 ❌"],["완속","5기"]];
  d2.forEach(([k, v], i) => {
    s.addText(`${k}`, { x: 5.45, y: 2.58 + i * 0.38, w: 1.8, h: 0.3, fontSize: 10, color: C.slate, fontFace: "Arial", margin: 0 });
    s.addText(v, { x: 7.3, y: 2.58 + i * 0.38, w: 2.0, h: 0.3, fontSize: 10, bold: true, color: i === 2 ? C.red : C.dark, fontFace: "Arial", margin: 0 });
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.45, y: 4.22, w: 4.1, h: 0.72,
    fill: { color: "FEF2F2" }, line: { color: C.red }
  });
  s.addText("✅ 진짜 사각지대: 일반 주거지역\n주민센터·절·복지센터에 완속 5기가 전부\n급속 0기 — 공공 충전 인프라 절대 부족", {
    x: 5.55, y: 4.28, w: 3.9, h: 0.62,
    fontSize: 8.5, color: C.red, fontFace: "Arial", margin: 0
  });
}

// ══════════════════════════════════════════════════════════
// SLIDE 9 — 앱 구현 소개
// ══════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  addTopBar(s, "대시보드 앱 구현", "06 · Application");

  s.addText("Streamlit 기반 인터랙티브 분석 대시보드", {
    x: 0.35, y: 1.25, w: 9.3, h: 0.35,
    fontSize: 13, bold: true, color: C.navy, fontFace: "Arial", margin: 0
  });

  // 탭 1
  addCard(s, 0.3, 1.7, 4.6, 3.6, { accent: C.blue });
  s.addText("📊 Tab 1 · 인프라 분석", {
    x: 0.5, y: 1.78, w: 4.2, h: 0.35,
    fontSize: 12, bold: true, color: C.blue, fontFace: "Arial", margin: 0
  });
  const f1 = [
    "자치구 / 행정동 단위 전환 표시",
    "부족지수 · 편의지수 · 전기차 수 · 충전기 수 4가지 모드",
    "충전소 클러스터 오버레이 (파란 버블)",
    "자치구별 순위 패널 & 부족 동 TOP 목록",
    "전체 행정동 데이터 필터링 테이블",
  ];
  f1.forEach((t, i) => {
    s.addText([{ text: t, options: { bullet: true } }], {
      x: 0.5, y: 2.22 + i * 0.48, w: 4.2, h: 0.38,
      fontSize: 10, color: C.dark, fontFace: "Arial", margin: 0
    });
  });

  // 탭 2
  addCard(s, 5.1, 1.7, 4.6, 3.6, { accent: C.cyan });
  s.addText("🔌 Tab 2 · 가까운 충전소 찾기", {
    x: 5.3, y: 1.78, w: 4.2, h: 0.35,
    fontSize: 12, bold: true, color: C.blue, fontFace: "Arial", margin: 0
  });
  const f2 = [
    "카카오 로컬 API 주소 검색 (건물명 포함)",
    "GPS 자동 위치 감지 지원",
    "가장 가까운 충전소 TOP 3 탐색",
    "1·2·3 번호 마커 + 카드 클릭 시 지도 이동·확대",
    "급속 / 완속 충전기 현황 표시",
  ];
  f2.forEach((t, i) => {
    s.addText([{ text: t, options: { bullet: true } }], {
      x: 5.3, y: 2.22 + i * 0.48, w: 4.2, h: 0.38,
      fontSize: 10, color: C.dark, fontFace: "Arial", margin: 0
    });
  });

  // 기술 스택
  const techs = ["Streamlit", "Folium / OpenStreetMap", "카카오 로컬 API", "Pandas · Shapely · NumPy"];
  s.addText("기술 스택: " + techs.join("  |  "), {
    x: 0.3, y: 5.35, w: 9.4, h: 0.22,
    fontSize: 9, color: C.slate, fontFace: "Arial", margin: 0
  });
}

// ══════════════════════════════════════════════════════════
// SLIDE 10 — 데이터 신뢰도 & 한계
// ══════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  addTopBar(s, "데이터 신뢰도 검증 및 한계", "06-1 · Validation & Limitations");

  // 검증 결과
  addCard(s, 0.3, 1.25, 4.5, 2.3, { accent: C.green });
  s.addText("✅ 검증 결과", {
    x: 0.5, y: 1.32, w: 4.1, h: 0.35,
    fontSize: 12, bold: true, color: C.green, fontFace: "Arial", margin: 0
  });
  s.addText("GPS 좌표 → 행정동 폴리곤 point-in-polygon 검사로 충전기 수 실측 대조", {
    x: 0.5, y: 1.72, w: 4.2, h: 0.38,
    fontSize: 9.5, color: C.dark, fontFace: "Arial", margin: 0
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 2.14, w: 4.2, h: 0.52,
    fill: { color: "F0FDF4" }, line: { color: C.green }
  });
  s.addText("TOP 15 중 14곳 충전기 수 정확히 일치(±1)\n→ 부족 순위는 신뢰 가능", {
    x: 0.6, y: 2.19, w: 4.0, h: 0.43,
    fontSize: 10, bold: true, color: C.green, fontFace: "Arial", margin: 0
  });
  s.addText("단, 일부 동은 보정 시 등급 변동 가능\n(용산2가동·반포본동 등 ⚠️ 표시)", {
    x: 0.5, y: 2.74, w: 4.2, h: 0.38,
    fontSize: 9, color: C.slate, fontFace: "Arial", margin: 0
  });

  // 데이터 한계
  addCard(s, 5.2, 1.25, 4.5, 2.3, { accent: C.orange });
  s.addText("⚠️ 분석 범위 한계", {
    x: 5.4, y: 1.32, w: 4.1, h: 0.35,
    fontSize: 12, bold: true, color: C.orange, fontFace: "Arial", margin: 0
  });
  const limits = [
    "아파트 입주민 전용 충전기 미포함\n(공단 DB 미등록 → 분석 제외)",
    "완속과 급속을 동일 1기로 카운트\n(실제 체감 부족과 차이 가능)",
    "GPS 누락 충전기 216기(0.3%) 행정동 미배정",
  ];
  limits.forEach((t, i) => {
    s.addText(t, {
      x: 5.4, y: 1.75 + i * 0.56, w: 4.2, h: 0.46,
      fontSize: 9.5, color: C.dark, fontFace: "Arial", margin: 0
    });
  });

  // 실시간 API 이슈
  addCard(s, 0.3, 3.7, 9.4, 1.65, { accent: C.slate });
  s.addText("실시간 충전 현황 API 미작동 경위", {
    x: 0.5, y: 3.77, w: 9.0, h: 0.35,
    fontSize: 12, bold: true, color: C.dark, fontFace: "Arial", margin: 0
  });
  s.addText("공공데이터포털 getChargerStatus API 시도 → 응답 속도 약 21초·동시 요청 시 100% 타임아웃 → 서비스 불가 판단 후 제거\n→ ev.or.kr은 환경공단 내부 실시간 연계 사용 (공개 API와 별개, 품질 차이 존재)", {
    x: 0.5, y: 4.15, w: 9.0, h: 0.7,
    fontSize: 9.5, color: C.slate, fontFace: "Arial", margin: 0
  });
}

// ══════════════════════════════════════════════════════════
// SLIDE 11 — 정책 시사점 & 결론
// ══════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  addTopBar(s, "정책 시사점 및 결론", "07 · Conclusion");

  // 핵심 메시지 박스
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.3, y: 1.25, w: 9.4, h: 0.8,
    fill: { color: C.navy }, line: { color: C.navy }, shadow: makeShadow()
  });
  s.addText("\"서울의 충전 인프라는 평균적으로 충분하다. 그러나 행정동 단위로 보면 충전 사각지대가 숨어 있다.\"", {
    x: 0.5, y: 1.35, w: 9.0, h: 0.6,
    fontSize: 13, bold: true, color: C.white, align: "center", fontFace: "Arial", margin: 0
  });

  const points = [
    [C.blue,   "01", "자치구 단위 정책의 한계",
     "25개 구 전체가 부족지수 '충분' — 구 평균 통계로는 사각지대를 발견할 수 없음\n행정동 단위 접근이 필수적"],
    [C.orange, "02", "우선 투자 15개 동 도출",
     "중곡 일대(광진구 3곳)·개포1동·망우3동 등 공공 충전 인프라 실질 부족\n대치1동은 전기차 3,428대로 절대 수요 최대 — 확충 효과 가장 큼"],
    [C.green,  "03", "수요 규모 병행 고려",
     "부족지수만이 아닌 절대 수요 규모를 함께 고려한 투자 우선순위 책정 필요\n급속 충전기 비율(현 7.9%) 제고 방향도 검토 필요"],
  ];

  points.forEach(([color, num, title, desc], i) => {
    const y = 2.22 + i * 1.02;
    addCard(s, 0.3, y, 9.4, 0.9, { accent: color });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.45, y: y + 0.12, w: 0.5, h: 0.62,
      fill: { color }, line: { color }
    });
    s.addText(num, {
      x: 0.45, y: y + 0.18, w: 0.5, h: 0.5,
      fontSize: 14, bold: true, color: C.white, align: "center", fontFace: "Arial", margin: 0
    });
    s.addText(title, {
      x: 1.1, y: y + 0.1, w: 8.4, h: 0.3,
      fontSize: 12, bold: true, color: C.dark, fontFace: "Arial", margin: 0
    });
    s.addText(desc, {
      x: 1.1, y: y + 0.44, w: 8.4, h: 0.38,
      fontSize: 9.5, color: C.slate, fontFace: "Arial", margin: 0
    });
  });

  s.addText("\"전기차 사도 될까?\" — 한국은 충전기 1기당 전기차 약 2대로 세계 1위(IEA). 사각지대 거주가 아니라면 구매 OK. 구매 전 우리 앱으로 동네 인프라 확인!", {
    x: 0.3, y: 5.16, w: 9.4, h: 0.22,
    fontSize: 9.5, bold: true, color: C.blue, fontFace: "Arial", margin: 0
  });

  s.addText("데이터 출처: 자동차관리정보시스템(국토교통부, 2026.04) · 한국환경공단 충전소 API(2026.05.12)", {
    x: 0.3, y: 5.4, w: 9.4, h: 0.2,
    fontSize: 8, color: C.gray, fontFace: "Arial", margin: 0
  });
}

// ══════════════════════════════════════════════════════════
// SLIDE 12 — 팀 역할 분담
// ══════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  addTopBar(s, "팀 역할 분담", "Team Roles");

  const roles = [
    ["1번", "데이터 수집 & 전처리", C.blue,
     ["한국환경공단 API 수집 및 파싱", "전기차 등록 Excel 데이터 처리", "행정동 GPS 폴리곤 매핑"]],
    ["2번", "분석 & 지표 설계", C.cyan,
     ["부족지수 · 편의지수 정의 및 산출", "행정동 단위 사각지대 도출", "GPS 실측 데이터 신뢰도 검증"]],
    ["3번", "앱 개발 & 시각화", C.navy,
     ["Streamlit 대시보드 구현", "Folium 지도 시각화 (자치구/행정동)", "카카오 API 주소 검색 연동"]],
    ["4번", "발표 & 문서화", C.slate,
     ["최종 발표자료(PPT) 제작", "핵심정리 문서 작성", "결론 및 정책 시사점 정리"]],
  ];

  roles.forEach(([num, title, color, items], i) => {
    const x = i < 2 ? 0.3 + i * 4.85 : 0.3 + (i - 2) * 4.85;
    const y = i < 2 ? 1.25 : 3.35;

    addCard(s, x, y, 4.6, 1.85, { accent: color });
    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 4.6, h: 0.46,
      fill: { color }, line: { color }
    });
    s.addText(`${num}  ·  ${title}`, {
      x: x + 0.12, y: y + 0.07, w: 4.3, h: 0.32,
      fontSize: 11, bold: true, color: C.white, fontFace: "Arial", margin: 0
    });
    items.forEach((item, j) => {
      s.addText([{ text: item, options: { bullet: true } }], {
        x: x + 0.12, y: y + 0.55 + j * 0.4, w: 4.3, h: 0.35,
        fontSize: 10, color: C.dark, fontFace: "Arial", margin: 0
      });
    });
  });
}

// ══════════════════════════════════════════════════════════
// SLIDE 13 — 어려웠던 점 & 해결 과정
// ══════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  addTopBar(s, "수행 과정의 어려움과 해결", "Challenges & Solutions");

  const challenges = [
    [C.red,    "행정동 vs 법정동 혼재",
               "주소가 법정동명으로 표기 → 행정동 배정 불가 (1,043기 미배정)",
               "GPS 폴리곤 실측 매핑 + GPS 없는 엑셀 보완분 제외 → 216기(0.3%)로 축소"],
    [C.orange, "실시간 API 미작동",
               "충전소 1개 조회에 15~25초 소요, 동시 요청 100% 타임아웃",
               "원인 규명 후 실시간 기능 제거 → 정적 데이터로 대체, 속도 개선"],
    [C.yellow, "주소 검색 속도·정확도",
               "Nominatim 응답 느림, 건물명 검색 정확도 낮음",
               "카카오 로컬 API로 교체 (~0.3초), 주소·키워드 이중 검색 적용"],
    [C.blue,   "반경 탐색 성능",
               "7만 건 데이터에 파이썬 루프 Haversine 계산 → 매 검색마다 느림",
               "numpy 벡터 연산으로 전환 → 즉시 처리"],
    [C.slate,  "비서울 지역 지도 표시 버그",
               "행정동별 모드에서 인천 등 비서울 지역이 지도에 표시됨",
               "GeoJSON 로드 시 서울 25개 자치구 필터링 추가로 해결"],
  ];

  challenges.forEach(([color, title, problem, solution], i) => {
    const x = i % 2 === 0 ? 0.3 : 5.15;
    const y = 1.22 + Math.floor(i / 2) * 1.42;

    addCard(s, x, y, 4.55, 1.28, { accent: color });
    s.addText(title, {
      x: x + 0.15, y: y + 0.06, w: 4.2, h: 0.28,
      fontSize: 11, bold: true, color, fontFace: "Arial", margin: 0
    });
    s.addText(`❌  ${problem}`, {
      x: x + 0.15, y: y + 0.38, w: 4.2, h: 0.28,
      fontSize: 9, color: C.slate, fontFace: "Arial", margin: 0
    });
    s.addText(`✅  ${solution}`, {
      x: x + 0.15, y: y + 0.68, w: 4.2, h: 0.52,
      fontSize: 9, color: C.dark, fontFace: "Arial", margin: 0
    });
  });
}

// ══════════════════════════════════════════════════════════
// SLIDE 14 — 마무리
// ══════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.dark };

  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 3.5, h: 5.625,
    fill: { color: C.navy }, line: { color: C.navy }
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 3.5, y: 0, w: 0.08, h: 5.625,
    fill: { color: C.cyan }, line: { color: C.cyan }
  });

  s.addText("⚡", { x: 0.4, y: 0.8, w: 2.5, h: 1.2, fontSize: 64, align: "center", margin: 0 });
  s.addText("감사합니다", {
    x: 0.2, y: 2.2, w: 3.0, h: 0.6,
    fontSize: 18, bold: true, color: C.white, align: "center", fontFace: "Arial", margin: 0
  });
  s.addShape(pres.shapes.LINE, {
    x: 0.5, y: 2.9, w: 2.5, h: 0,
    line: { color: C.cyan, width: 1 }
  });
  s.addText("Q & A", {
    x: 0.2, y: 3.05, w: 3.0, h: 0.45,
    fontSize: 14, color: C.cyanL, align: "center", fontFace: "Arial", margin: 0
  });

  s.addText("GitHub", {
    x: 3.9, y: 1.0, w: 2.0, h: 0.3,
    fontSize: 10, color: C.gray, fontFace: "Arial", margin: 0
  });
  s.addText("github.com/goodpyo/seoul-ev-infra", {
    x: 3.9, y: 1.3, w: 5.7, h: 0.3,
    fontSize: 11, color: C.cyan, fontFace: "Arial", margin: 0
  });

  const summary = [
    ["전기차 111,761대", "서울 등록 현황 (2026.04)"],
    ["충전기 69,770기",  "공용 충전 인프라 (2026.05)"],
    ["15개 동 사각지대", "행정동 단위 분석으로 도출"],
    ["중곡1동 급속 0기", "진짜 공공 충전 사각지대"],
  ];
  summary.forEach(([num, desc], i) => {
    const y = 2.1 + i * 0.82;
    s.addText(num, {
      x: 3.9, y, w: 5.7, h: 0.38,
      fontSize: 16, bold: true, color: C.white, fontFace: "Arial", margin: 0
    });
    s.addText(desc, {
      x: 3.9, y: y + 0.38, w: 5.7, h: 0.3,
      fontSize: 9.5, color: C.gray, fontFace: "Arial", margin: 0
    });
  });
}

// ── 저장 ──
const outPath = "D:\\DevRefs\\ssu\\classes\\AI_Programming\\proj\\TeamProject\\서울시_EV_인프라분석_최종발표.pptx";
pres.writeFile({ fileName: outPath }).then(() => {
  console.log("✅ 저장 완료:", outPath);
}).catch(e => console.error("❌ 오류:", e));
