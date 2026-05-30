const pptxgen = require("pptxgenjs");

// ─── Color palette (Electric Navy theme) ─────────────────────────────────────
const C = {
  darkBg:    "060E1F",   // very dark navy (cover, Q&A)
  midBg:     "0D1B35",   // dark navy (section headers)
  cardBg:    "1A2B4A",   // card background
  contentBg: "F0F4FF",   // light slide background
  accent1:   "00C8FF",   // electric cyan (primary highlight)
  accent2:   "3B82F6",   // bright blue
  accent3:   "10B981",   // mint green
  warn:      "F59E0B",   // amber
  danger:    "EF4444",   // red
  white:     "FFFFFF",
  offWhite:  "D0DCF0",
  muted:     "7A94BF",
  dark:      "1E2B42",
  tagBg:     "142038",
};

function makeShadow() {
  return { type: "outer", blur: 8, offset: 3, angle: 135, color: "000000", opacity: 0.18 };
}

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.title = "서울시 전기차 충전 인프라 분석";
pres.author = "AI Programming Team";

// ─── Helper: slide number ─────────────────────────────────────────────────────
function addPageNum(slide, num, total, light = false) {
  const color = light ? C.muted : "4A6080";
  slide.addText(`${num} / ${total}`, {
    x: 9.3, y: 5.2, w: 0.6, h: 0.3,
    fontSize: 9, color, align: "right", margin: 0
  });
}

// ─── Helper: section label pill ──────────────────────────────────────────────
function addSectionPill(slide, label, color = C.accent1) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.4, y: 0.22, w: 1.6, h: 0.32,
    fill: { color: C.cardBg }, line: { color, width: 1.2 }, rectRadius: 0.08
  });
  slide.addText(label, {
    x: 0.4, y: 0.22, w: 1.6, h: 0.32,
    fontSize: 9, color, align: "center", valign: "middle",
    bold: true, charSpacing: 1, margin: 0
  });
}

// ─── Helper: dark card ────────────────────────────────────────────────────────
function addCard(slide, x, y, w, h) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y, w, h,
    fill: { color: C.cardBg },
    line: { color: "253E6A", width: 0.5 },
    shadow: makeShadow()
  });
}

// ─── Helper: accent bar + title (light slides) ────────────────────────────────
function addSlideTitle(slide, title, subtitle) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 1.05,
    fill: { color: C.midBg }, line: { color: C.midBg }
  });
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 1.05, w: 10, h: 0.055,
    fill: { color: C.accent1 }, line: { color: C.accent1 }
  });
  slide.addText(title, {
    x: 0.5, y: 0.15, w: 8.5, h: 0.75,
    fontSize: 26, bold: true, color: C.white,
    fontFace: "Malgun Gothic", valign: "middle", margin: 0
  });
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.5, y: 0.72, w: 8.5, h: 0.33,
      fontSize: 11, color: C.offWhite, margin: 0
    });
  }
}

const TOTAL = 13;

// ════════════════════════════════════════════════════════
// SLIDE 1: Cover
// ════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.darkBg };

  // Background grid pattern (decorative rectangles)
  for (let i = 0; i < 6; i++) {
    s.addShape(pres.shapes.RECTANGLE, {
      x: 7.2 + i * 0.45, y: 0, w: 0.35, h: 5.625,
      fill: { color: "0D1B35", transparency: 30 }, line: { color: "0D1B35" }
    });
  }

  // Glowing accent circle
  s.addShape(pres.shapes.OVAL, {
    x: 6.8, y: -0.5, w: 4.5, h: 4.5,
    fill: { color: "00C8FF", transparency: 88 }, line: { color: "00C8FF", width: 0.5 }
  });

  // Top accent bar
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 0.25, h: 5.625,
    fill: { color: C.accent1 }, line: { color: C.accent1 }
  });

  // Lightning bolt emoji placeholder
  s.addText("⚡", { x: 0.45, y: 0.55, w: 0.7, h: 0.7, fontSize: 32, margin: 0 });

  // Title
  s.addText("서울시 전기차 충전 인프라", {
    x: 0.45, y: 1.3, w: 9.1, h: 0.85,
    fontSize: 38, bold: true, color: C.white,
    fontFace: "Malgun Gothic", margin: 0
  });
  s.addText("부족 지역 분석 및 시각화 서비스", {
    x: 0.45, y: 2.12, w: 9.1, h: 0.75,
    fontSize: 30, bold: true, color: C.accent1,
    fontFace: "Malgun Gothic", margin: 0
  });

  // Divider
  s.addShape(pres.shapes.LINE, {
    x: 0.45, y: 3.02, w: 5.5, h: 0,
    line: { color: "253E6A", width: 1 }
  });

  // Sub info
  s.addText([
    { text: "AI 프로그래밍 팀 프로젝트  ", options: { bold: true, color: C.offWhite } },
    { text: "|  2026년 5월", options: { color: C.muted } }
  ], { x: 0.45, y: 3.2, w: 7, h: 0.4, fontSize: 13, margin: 0 });

  s.addText([
    { text: "데이터 출처: ", options: { color: C.muted } },
    { text: "자동차관리정보시스템(국토교통부) · 서울특별시", options: { color: C.offWhite } }
  ], { x: 0.45, y: 3.75, w: 8, h: 0.35, fontSize: 10, margin: 0 });
}

// ════════════════════════════════════════════════════════
// SLIDE 2: Agenda
// ════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.contentBg };
  addSlideTitle(s, "Agenda", "발표 순서");
  addPageNum(s, 2, TOTAL);

  const items = [
    { num: "01", label: "주제 선정 배경",    sub: "전기차 보급 vs 충전 인프라 불균형", color: C.accent2 },
    { num: "02", label: "데이터 수집",        sub: "2개 공공데이터셋 소개", color: C.accent1 },
    { num: "03", label: "데이터 전처리 & 지표", sub: "부족지수 · 충전편의지수 산출", color: C.accent3 },
    { num: "04", label: "서비스 주요 기능",   sub: "지도 시각화 & 충전소 안내", color: C.warn },
    { num: "05", label: "분석 결과",          sub: "부족 지역 및 자치구별 현황", color: "F472B6" },
    { num: "06", label: "기술 스택 & 시연",  sub: "Python · Streamlit · Folium", color: C.accent2 },
    { num: "07", label: "결론 & Q&A",         sub: "향후 발전 방향", color: C.accent3 },
  ];

  const cols = [0.35, 5.25];
  items.forEach((item, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = cols[col];
    const y = 1.3 + row * 1.22;
    const w = 4.5;

    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w, h: 1.0,
      fill: { color: C.midBg }, line: { color: "1E3560", width: 0.8 },
      shadow: makeShadow()
    });
    // left accent
    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 0.07, h: 1.0,
      fill: { color: item.color }, line: { color: item.color }
    });
    // number
    s.addText(item.num, {
      x: x + 0.15, y: y + 0.07, w: 0.55, h: 0.4,
      fontSize: 20, bold: true, color: item.color, margin: 0
    });
    // label
    s.addText(item.label, {
      x: x + 0.75, y: y + 0.1, w: w - 0.85, h: 0.45,
      fontSize: 14, bold: true, color: C.white, margin: 0
    });
    // sub
    s.addText(item.sub, {
      x: x + 0.75, y: y + 0.55, w: w - 0.85, h: 0.35,
      fontSize: 10, color: C.muted, margin: 0
    });
  });
}

// ════════════════════════════════════════════════════════
// SLIDE 3: Background 1 — Why EV Charging?
// ════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.contentBg };
  addSlideTitle(s, "왜 전기차 충전 인프라인가?", "주제 선정 배경 (1/2)");
  addSectionPill(s, "01  배경", C.accent2);
  addPageNum(s, 3, TOTAL);

  // Big stats
  const stats = [
    { val: "6만+", label: "서울시 전기차\n등록 대수 (2026.04)", color: C.accent1 },
    { val: "↑매년", label: "전기차 등록 수\n지속 증가", color: C.accent3 },
    { val: "?%", label: "충전 인프라\n보급률", color: C.warn },
  ];
  stats.forEach((st, i) => {
    const x = 0.4 + i * 3.1;
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.3, w: 2.8, h: 1.2,
      fill: { color: C.midBg }, line: { color: "253E6A" }, shadow: makeShadow()
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.3, w: 2.8, h: 0.07,
      fill: { color: st.color }, line: { color: st.color }
    });
    s.addText(st.val, {
      x: x + 0.1, y: 1.38, w: 2.6, h: 0.55,
      fontSize: 28, bold: true, color: st.color, align: "center", margin: 0
    });
    s.addText(st.label, {
      x: x + 0.1, y: 1.93, w: 2.6, h: 0.5,
      fontSize: 10, color: C.offWhite, align: "center", margin: 0
    });
  });

  // Key points
  const points = [
    { icon: "🔋", text: "전기차 보급 급증 — 환경부 목표 2030년 친환경차 450만 대" },
    { icon: "⚡", text: "충전 인프라는 보급 속도를 따라가지 못하는 현실" },
    { icon: "😰", text: '"충전 불안(Charge Anxiety)" → 전기차 구매 기피 주요 원인' },
    { icon: "🗺️", text: "데이터 기반으로 부족 지역을 정량적·시각적으로 파악할 필요" },
  ];
  points.forEach((p, i) => {
    s.addText(`${p.icon}  ${p.text}`, {
      x: 0.4, y: 2.72 + i * 0.66,
      w: 9.2, h: 0.55,
      fontSize: 13, color: C.dark, margin: [0, 0, 0, 12],
      fontFace: "Malgun Gothic"
    });
    s.addShape(pres.shapes.LINE, {
      x: 0.4, y: 2.72 + i * 0.66 + 0.54, w: 9.2, h: 0,
      line: { color: "DDE5F5", width: 0.5 }
    });
  });
}

// ════════════════════════════════════════════════════════
// SLIDE 4: Background 2 — Problem Definition
// ════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.contentBg };
  addSlideTitle(s, "문제 정의", "주제 선정 배경 (2/2)");
  addSectionPill(s, "01  배경", C.accent2);
  addPageNum(s, 4, TOTAL);

  // Three problem boxes
  const problems = [
    {
      num: "01",
      title: "데이터 기반 불균형 파악",
      desc: "행정동 단위로 전기차 등록 수 vs 충전기 설치 수의 불균형을 정량적으로 측정",
      color: C.accent2
    },
    {
      num: "02",
      title: "직관적 지역 시각화",
      desc: "인프라 부족 지역을 색상(빨강↔초록)으로 표현해 누구나 쉽게 파악 가능",
      color: C.accent1
    },
    {
      num: "03",
      title: "시민 활용 충전소 안내",
      desc: "내 위치에서 가장 가까운 충전소를 즉시 검색 → 충전 불안 해소",
      color: C.accent3
    },
  ];

  problems.forEach((p, i) => {
    const y = 1.38 + i * 1.3;
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.35, y, w: 9.3, h: 1.15,
      fill: { color: C.midBg }, line: { color: "253E6A" }, shadow: makeShadow()
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.35, y, w: 0.08, h: 1.15,
      fill: { color: p.color }, line: { color: p.color }
    });
    s.addText(p.num, {
      x: 0.5, y: y + 0.1, w: 0.55, h: 0.4,
      fontSize: 18, bold: true, color: p.color, margin: 0
    });
    s.addText(p.title, {
      x: 1.12, y: y + 0.1, w: 7.9, h: 0.42,
      fontSize: 15, bold: true, color: C.white, margin: 0
    });
    s.addText(p.desc, {
      x: 1.12, y: y + 0.55, w: 7.9, h: 0.5,
      fontSize: 12, color: C.offWhite, margin: 0
    });
  });
}

// ════════════════════════════════════════════════════════
// SLIDE 5: Data Collection
// ════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.contentBg };
  addSlideTitle(s, "데이터 수집", "공공데이터 2종 활용");
  addSectionPill(s, "02  데이터", C.accent1);
  addPageNum(s, 5, TOTAL);

  // Dataset 1
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.35, y: 1.28, w: 4.55, h: 3.85,
    fill: { color: C.midBg }, line: { color: "253E6A" }, shadow: makeShadow()
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.35, y: 1.28, w: 4.55, h: 0.07,
    fill: { color: C.accent2 }, line: { color: C.accent2 }
  });
  s.addText("📊  데이터셋 ①", {
    x: 0.5, y: 1.38, w: 4.2, h: 0.42,
    fontSize: 13, bold: true, color: C.accent2, margin: 0
  });
  s.addText("서울시 자치구 읍면동별\n연료별 자동차 등록현황", {
    x: 0.5, y: 1.82, w: 4.2, h: 0.72,
    fontSize: 14, bold: true, color: C.white, margin: 0
  });
  const d1items = [
    "출처: 자동차관리정보시스템 (국토교통부)",
    "기준일: 2026년 4월",
    "형태: Excel (.xlsx)",
    "행 수: 약 5,190개",
    "주요 컬럼: 시군구, 행정동, 연료, 등록대수",
    "처리: '전기' 연료 필터링 → 동별 합산",
  ];
  d1items.forEach((t, i) => {
    s.addText([
      { text: "▪ ", options: { color: C.accent2, bold: true } },
      { text: t, options: { color: C.offWhite } }
    ], {
      x: 0.5, y: 2.6 + i * 0.38, w: 4.2, h: 0.34,
      fontSize: 11, margin: 0
    });
  });

  // Dataset 2
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.1, y: 1.28, w: 4.55, h: 3.85,
    fill: { color: C.midBg }, line: { color: "253E6A" }, shadow: makeShadow()
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.1, y: 1.28, w: 4.55, h: 0.07,
    fill: { color: C.accent1 }, line: { color: C.accent1 }
  });
  s.addText("⚡  데이터셋 ②", {
    x: 5.25, y: 1.38, w: 4.2, h: 0.42,
    fontSize: 13, bold: true, color: C.accent1, margin: 0
  });
  s.addText("서울시 전기차\n충전소 설치현황", {
    x: 5.25, y: 1.82, w: 4.2, h: 0.72,
    fontSize: 14, bold: true, color: C.white, margin: 0
  });
  const d2items = [
    "출처: 서울특별시 제공",
    "기준일: 2026년 5월 12일",
    "형태: Excel (.xlsx)",
    "행 수: 588개 충전소",
    "주요 컬럼: 설치장소, 주소, 급속·완속 충전기 수",
    "처리: 주소에서 자치구·동명 추출 (Regex)",
  ];
  d2items.forEach((t, i) => {
    s.addText([
      { text: "▪ ", options: { color: C.accent1, bold: true } },
      { text: t, options: { color: C.offWhite } }
    ], {
      x: 5.25, y: 2.6 + i * 0.38, w: 4.2, h: 0.34,
      fontSize: 11, margin: 0
    });
  });
}

// ════════════════════════════════════════════════════════
// SLIDE 6: Data Processing
// ════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.contentBg };
  addSlideTitle(s, "데이터 전처리 과정", "두 데이터셋 결합 및 지표 산출");
  addSectionPill(s, "03  전처리", C.accent3);
  addPageNum(s, 6, TOTAL);

  // Flow steps
  const steps = [
    { num: "1", label: "전기차 필터링",        desc: "연료 = '전기' 조건으로 필터링 후\n행정동별 대수 합산", color: C.accent2 },
    { num: "2", label: "주소 파싱",             desc: "정규표현식으로 '구명', '동명' 추출\n예: '서울특별시 강남구 자곡동...'", color: C.accent1 },
    { num: "3", label: "데이터 JOIN",           desc: "자치구 + 행정동 기준\nOUTER JOIN 수행", color: C.accent3 },
    { num: "4", label: "결측값 처리",           desc: "충전소 없는 동 → 0으로 처리\n전기차 없는 동 포함", color: C.warn },
    { num: "5", label: "분석 지표 산출",        desc: "부족지수 & 충전편의지수 계산\n→ 인프라 상태 등급화", color: "F472B6" },
  ];

  steps.forEach((step, i) => {
    const x = 0.3 + i * 1.88;
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.35, w: 1.68, h: 2.7,
      fill: { color: C.midBg }, line: { color: "253E6A" }, shadow: makeShadow()
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.35, w: 1.68, h: 0.07,
      fill: { color: step.color }, line: { color: step.color }
    });

    s.addShape(pres.shapes.OVAL, {
      x: x + 0.59, y: 1.48, w: 0.5, h: 0.5,
      fill: { color: step.color }, line: { color: step.color }
    });
    s.addText(step.num, {
      x: x + 0.59, y: 1.48, w: 0.5, h: 0.5,
      fontSize: 16, bold: true, color: C.darkBg, align: "center", valign: "middle", margin: 0
    });
    s.addText(step.label, {
      x: x + 0.1, y: 2.1, w: 1.48, h: 0.5,
      fontSize: 11.5, bold: true, color: C.white, align: "center", margin: 0
    });
    s.addText(step.desc, {
      x: x + 0.1, y: 2.65, w: 1.48, h: 1.25,
      fontSize: 9.5, color: C.offWhite, align: "center", margin: 0
    });

    // Arrow between steps
    if (i < steps.length - 1) {
      s.addShape(pres.shapes.LINE, {
        x: x + 1.73, y: 2.72, w: 0.13, h: 0,
        line: { color: C.muted, width: 1.5 }
      });
      s.addText("›", {
        x: x + 1.8, y: 2.59, w: 0.15, h: 0.3,
        fontSize: 16, color: C.muted, margin: 0, align: "center"
      });
    }
  });

  // Formula box
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.3, y: 4.3, w: 9.4, h: 1.0,
    fill: { color: C.tagBg }, line: { color: "253E6A" }
  });
  s.addText([
    { text: "  부족지수 = ", options: { color: C.warn, bold: true } },
    { text: "전기차 수 ÷ 충전기 수", options: { color: C.offWhite } },
    { text: "     |     ", options: { color: C.muted } },
    { text: "충전편의지수 = ", options: { color: C.accent1, bold: true } },
    { text: "(급속×3 + 완속) ÷ 전기차 수 × 100", options: { color: C.offWhite } },
  ], {
    x: 0.3, y: 4.3, w: 9.4, h: 1.0,
    fontSize: 12.5, align: "center", valign: "middle", margin: 0
  });
}

// ════════════════════════════════════════════════════════
// SLIDE 7: Key Metrics
// ════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.contentBg };
  addSlideTitle(s, "핵심 분석 지표", "인프라 상태 정량화 기준");
  addSectionPill(s, "03  전처리", C.accent3);
  addPageNum(s, 7, TOTAL);

  // Shortage Index
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.35, y: 1.28, w: 4.55, h: 3.9,
    fill: { color: C.midBg }, line: { color: "253E6A" }, shadow: makeShadow()
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.35, y: 1.28, w: 4.55, h: 0.07,
    fill: { color: C.warn }, line: { color: C.warn }
  });
  s.addText("⚠️  부족지수 (Shortage Index)", {
    x: 0.5, y: 1.38, w: 4.2, h: 0.4,
    fontSize: 13, bold: true, color: C.warn, margin: 0
  });
  s.addText("전기차 수 ÷ 충전기 수", {
    x: 0.5, y: 1.82, w: 4.2, h: 0.38,
    fontSize: 12, color: C.offWhite, italic: true, margin: 0
  });
  s.addText("높을수록 인프라가 부족한 지역", {
    x: 0.5, y: 2.18, w: 4.2, h: 0.32,
    fontSize: 10.5, color: C.muted, margin: 0
  });

  const levels = [
    { label: "매우 부족", range: "> 20", color: C.danger },
    { label: "부족",      range: "10 ~ 20", color: "F97316" },
    { label: "보통",      range: "5 ~ 10",  color: C.warn },
    { label: "충분",      range: "≤ 5",     color: C.accent3 },
  ];
  levels.forEach((lv, i) => {
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y: 2.65 + i * 0.56, w: 0.15, h: 0.38,
      fill: { color: lv.color }, line: { color: lv.color }
    });
    s.addText(`${lv.label}`, {
      x: 0.73, y: 2.65 + i * 0.56, w: 1.4, h: 0.38,
      fontSize: 12, bold: true, color: lv.color, margin: 0
    });
    s.addText(`(${lv.range})`, {
      x: 2.15, y: 2.65 + i * 0.56, w: 2.0, h: 0.38,
      fontSize: 11, color: C.offWhite, margin: 0
    });
  });

  // Convenience Index
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.1, y: 1.28, w: 4.55, h: 3.9,
    fill: { color: C.midBg }, line: { color: "253E6A" }, shadow: makeShadow()
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.1, y: 1.28, w: 4.55, h: 0.07,
    fill: { color: C.accent1 }, line: { color: C.accent1 }
  });
  s.addText("✅  충전편의지수 (Convenience Index)", {
    x: 5.25, y: 1.38, w: 4.2, h: 0.4,
    fontSize: 12, bold: true, color: C.accent1, margin: 0
  });
  s.addText("(급속×3 + 완속) ÷ 전기차 수 × 100", {
    x: 5.25, y: 1.82, w: 4.2, h: 0.38,
    fontSize: 12, color: C.offWhite, italic: true, margin: 0
  });
  s.addText("높을수록 충전이 편리한 지역 / 급속 가중치 3배", {
    x: 5.25, y: 2.18, w: 4.2, h: 0.32,
    fontSize: 10, color: C.muted, margin: 0
  });

  const clevels = [
    { label: "매우 좋음", range: "≥ 30",  color: C.accent3 },
    { label: "좋음",      range: "≥ 15",  color: "6EE7B7" },
    { label: "보통",      range: "≥ 5",   color: C.warn },
    { label: "나쁨",      range: "0 ~ 5", color: "F97316" },
    { label: "인프라 전무", range: "= 0", color: C.danger },
  ];
  clevels.forEach((lv, i) => {
    s.addShape(pres.shapes.RECTANGLE, {
      x: 5.25, y: 2.65 + i * 0.48, w: 0.15, h: 0.35,
      fill: { color: lv.color }, line: { color: lv.color }
    });
    s.addText(`${lv.label}`, {
      x: 5.48, y: 2.65 + i * 0.48, w: 1.6, h: 0.35,
      fontSize: 12, bold: true, color: lv.color, margin: 0
    });
    s.addText(`(${lv.range})`, {
      x: 7.1, y: 2.65 + i * 0.48, w: 2.0, h: 0.35,
      fontSize: 11, color: C.offWhite, margin: 0
    });
  });
}

// ════════════════════════════════════════════════════════
// SLIDE 8: Service Features
// ════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.contentBg };
  addSlideTitle(s, "서비스 주요 기능", "4가지 핵심 기능");
  addSectionPill(s, "04  기능", C.accent2);
  addPageNum(s, 8, TOTAL);

  const features = [
    {
      icon: "🗺️", num: "01",
      title: "인프라 부족 지역 지도",
      items: ["행정동별 부족지수 색상 표현 (빨강 → 초록)", "자치구 choropleth 오버레이", "클릭 시 상세 팝업 (전기차·충전기 수)"],
      color: C.accent2
    },
    {
      icon: "⚡", num: "02",
      title: "충전편의지수 지도",
      items: ["편의성 기반 지역 색상 표현", "급속·완속 가중치 반영", "4가지 모드 토글 선택 가능"],
      color: C.accent1
    },
    {
      icon: "📍", num: "03",
      title: "가까운 충전소 안내",
      items: ["주소 텍스트 입력 → 자동 위치 변환", "좌표 직접 입력 지원", "가까운 충전소 Top 5 + 거리 표시"],
      color: C.accent3
    },
    {
      icon: "📊", num: "04",
      title: "상세 데이터 테이블",
      items: ["자치구별 요약 (부족지수 순 정렬)", "상태 필터 (충전소 없음 / 부족 등)", "전체 행정동 데이터 다운로드"],
      color: C.warn
    },
  ];

  const positions = [
    [0.35, 1.28, 4.55],
    [5.1, 1.28, 4.55],
    [0.35, 3.22, 4.55],
    [5.1, 3.22, 4.55],
  ];

  features.forEach((f, i) => {
    const [x, y, w] = positions[i];
    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w, h: 1.82,
      fill: { color: C.midBg }, line: { color: "253E6A" }, shadow: makeShadow()
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w, h: 0.06,
      fill: { color: f.color }, line: { color: f.color }
    });
    s.addText(`${f.icon}  ${f.num}  ${f.title}`, {
      x: x + 0.15, y: y + 0.1, w: w - 0.2, h: 0.42,
      fontSize: 13, bold: true, color: C.white, margin: 0
    });
    f.items.forEach((item, j) => {
      s.addText([
        { text: "› ", options: { color: f.color, bold: true } },
        { text: item, options: { color: C.offWhite } }
      ], {
        x: x + 0.2, y: y + 0.58 + j * 0.36, w: w - 0.3, h: 0.33,
        fontSize: 10.5, margin: 0
      });
    });
  });
}

// ════════════════════════════════════════════════════════
// SLIDE 9: Analysis Results
// ════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.contentBg };
  addSlideTitle(s, "주요 분석 결과", "서울시 전기차 인프라 현황");
  addSectionPill(s, "05  결과", "F472B6");
  addPageNum(s, 9, TOTAL);

  // KPI row
  const kpis = [
    { val: "60,000+", label: "전기차 등록\n(대)", color: C.accent1 },
    { val: "1,000+",  label: "충전기 설치\n(기)", color: C.accent3 },
    { val: "588",     label: "충전소\n(개소)", color: C.accent2 },
    { val: "다수",    label: "충전소 없는\n행정동", color: C.danger },
  ];
  kpis.forEach((k, i) => {
    const x = 0.3 + i * 2.38;
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.28, w: 2.15, h: 1.05,
      fill: { color: C.midBg }, line: { color: "253E6A" }
    });
    s.addText(k.val, {
      x: x + 0.1, y: 1.3, w: 1.95, h: 0.55,
      fontSize: 24, bold: true, color: k.color, align: "center", margin: 0
    });
    s.addText(k.label, {
      x: x + 0.1, y: 1.83, w: 1.95, h: 0.42,
      fontSize: 9.5, color: C.muted, align: "center", margin: 0
    });
  });

  // Findings
  const findings = [
    { icon: "🔴", head: "충전소 없는 동 TOP 3", body: "강남구 대치1동 (3,428대) · 강서구 가양1동 (2,800대) · 서초구 양재1동 (2,766대)", color: C.danger },
    { icon: "📍", head: "부족지수 TOP 자치구",   body: "은평구 (384.9) · 금천구 (295.4) · 강남구 (147.5) · 관악구 (137.7)", color: C.warn },
    { icon: "📊", head: "강남구 역설",            body: "전기차 최다 지역 (15,631대)이지만 충전기 106기로 부족지수 147.5 — 절대적 수량 부족", color: "F472B6" },
    { icon: "⚠️", head: "충전소 편중 현상",      body: "충전소 588곳 중 강남·서초 집중 → 외곽 및 북부 지역 상대적 인프라 열악", color: C.accent2 },
  ];
  findings.forEach((f, i) => {
    const y = 2.48 + i * 0.74;
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.35, y, w: 9.3, h: 0.62,
      fill: { color: C.midBg }, line: { color: "1E3560" }
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.35, y, w: 0.07, h: 0.62,
      fill: { color: f.color }, line: { color: f.color }
    });
    s.addText(`${f.icon}  ${f.head}`, {
      x: 0.5, y: y + 0.04, w: 2.5, h: 0.3,
      fontSize: 11, bold: true, color: f.color, margin: 0
    });
    s.addText(f.body, {
      x: 3.1, y: y + 0.06, w: 6.4, h: 0.5,
      fontSize: 10.5, color: C.offWhite, margin: 0
    });
  });
}

// ════════════════════════════════════════════════════════
// SLIDE 10: Tech Stack
// ════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.contentBg };
  addSlideTitle(s, "기술 구현 스택", "Python 기반 풀스택 데이터 시각화");
  addSectionPill(s, "06  기술", C.accent2);
  addPageNum(s, 10, TOTAL);

  const stack = [
    { icon: "🐍", name: "Python 3.11",        role: "주 개발 언어",           color: C.accent2 },
    { icon: "🌐", name: "Streamlit",           role: "웹 애플리케이션 프레임워크",  color: C.accent1 },
    { icon: "🗺️", name: "Folium",             role: "인터랙티브 지도 시각화",     color: C.accent3 },
    { icon: "📦", name: "Pandas / OpenPyXL",  role: "데이터 처리 & Excel 파싱",  color: C.warn },
    { icon: "📍", name: "Geopy (Nominatim)",   role: "주소 → 좌표 변환 (Geocoding)",  color: "F472B6" },
    { icon: "📐", name: "Haversine Formula",  role: "두 지점 간 거리 계산 (km)",  color: C.accent2 },
  ];

  stack.forEach((item, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = col === 0 ? 0.35 : 5.15;
    const y = 1.35 + row * 1.38;

    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 4.5, h: 1.18,
      fill: { color: C.midBg }, line: { color: "253E6A" }, shadow: makeShadow()
    });
    s.addShape(pres.shapes.OVAL, {
      x: x + 0.2, y: y + 0.28, w: 0.62, h: 0.62,
      fill: { color: item.color, transparency: 80 }, line: { color: item.color, width: 1 }
    });
    s.addText(item.icon, {
      x: x + 0.2, y: y + 0.28, w: 0.62, h: 0.62,
      fontSize: 18, align: "center", valign: "middle", margin: 0
    });
    s.addText(item.name, {
      x: x + 1.0, y: y + 0.1, w: 3.3, h: 0.45,
      fontSize: 14, bold: true, color: C.white, margin: 0
    });
    s.addText(item.role, {
      x: x + 1.0, y: y + 0.58, w: 3.3, h: 0.45,
      fontSize: 11, color: C.muted, margin: 0
    });
  });
}

// ════════════════════════════════════════════════════════
// SLIDE 11: Demo
// ════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.midBg };
  addPageNum(s, 11, TOTAL, true);

  // Header
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 1.05,
    fill: { color: C.darkBg }, line: { color: C.darkBg }
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 1.05, w: 10, h: 0.055,
    fill: { color: C.accent3 }, line: { color: C.accent3 }
  });
  s.addText("🖥️  서비스 시연 (Demo)", {
    x: 0.5, y: 0.15, w: 9, h: 0.75,
    fontSize: 26, bold: true, color: C.white, margin: 0
  });

  // Demo screenshot placeholders
  const screens = [
    { title: "부족지수 지도", desc: "행정동별 색상 시각화\n빨강 = 인프라 부족", x: 0.3, w: 3.0 },
    { title: "편의지수 지도", desc: "충전 편의성 기반\n색상 표현", x: 3.55, w: 3.0 },
    { title: "충전소 검색", desc: "주소 입력 → Top 5\n가까운 충전소 안내", x: 6.8, w: 2.9 },
  ];
  screens.forEach((sc) => {
    s.addShape(pres.shapes.RECTANGLE, {
      x: sc.x, y: 1.28, w: sc.w, h: 2.9,
      fill: { color: "0A1525" }, line: { color: C.accent2, width: 1.2 }, shadow: makeShadow()
    });
    s.addText("[ 화면 캡처 ]", {
      x: sc.x + 0.1, y: 1.28 + 0.9, w: sc.w - 0.2, h: 0.6,
      fontSize: 13, color: "3A5580", align: "center", italic: true, margin: 0
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: sc.x, y: 4.28, w: sc.w, h: 0.7,
      fill: { color: C.cardBg }, line: { color: "253E6A" }
    });
    s.addText(sc.title, {
      x: sc.x + 0.1, y: 4.3, w: sc.w - 0.2, h: 0.34,
      fontSize: 11.5, bold: true, color: C.accent1, align: "center", margin: 0
    });
    s.addText(sc.desc, {
      x: sc.x + 0.1, y: 4.62, w: sc.w - 0.2, h: 0.32,
      fontSize: 9, color: C.muted, align: "center", margin: 0
    });
  });

  s.addText("streamlit run app.py  →  브라우저에서 http://localhost:8501", {
    x: 0.35, y: 5.1, w: 9.3, h: 0.38,
    fontSize: 11, color: C.accent3, align: "center", italic: true,
    fontFace: "Consolas", margin: 0
  });
}

// ════════════════════════════════════════════════════════
// SLIDE 12: Conclusion & Future
// ════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.contentBg };
  addSlideTitle(s, "결론 및 향후 발전 방향", "");
  addSectionPill(s, "07  결론", C.accent3);
  addPageNum(s, 12, TOTAL);

  // Conclusion
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.35, y: 1.28, w: 4.55, h: 3.9,
    fill: { color: C.midBg }, line: { color: "253E6A" }, shadow: makeShadow()
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.35, y: 1.28, w: 4.55, h: 0.07,
    fill: { color: C.accent3 }, line: { color: C.accent3 }
  });
  s.addText("✅  결론", {
    x: 0.5, y: 1.38, w: 4.2, h: 0.4,
    fontSize: 14, bold: true, color: C.accent3, margin: 0
  });
  const conclusions = [
    "공공데이터 기반으로 서울시 전기차 충전 인프라 불균형을 정량적으로 확인",
    "강남·강서 고밀도 주거지역의 충전 인프라 확충 필요성 도출",
    "부족지수·편의지수로 지역별 인프라 수준 비교 가능",
    "시민이 직접 활용 가능한 충전소 안내 서비스 구현",
    "파이썬 + 웹 기술만으로 실용적 데이터 서비스 완성",
  ];
  conclusions.forEach((c, i) => {
    s.addText([
      { text: "✓  ", options: { color: C.accent3, bold: true } },
      { text: c, options: { color: C.offWhite } }
    ], {
      x: 0.5, y: 1.88 + i * 0.6, w: 4.2, h: 0.55,
      fontSize: 11, margin: 0
    });
  });

  // Future
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.1, y: 1.28, w: 4.55, h: 3.9,
    fill: { color: C.midBg }, line: { color: "253E6A" }, shadow: makeShadow()
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.1, y: 1.28, w: 4.55, h: 0.07,
    fill: { color: C.accent2 }, line: { color: C.accent2 }
  });
  s.addText("🚀  향후 발전 방향", {
    x: 5.25, y: 1.38, w: 4.2, h: 0.4,
    fontSize: 14, bold: true, color: C.accent2, margin: 0
  });
  const futures = [
    { icon: "📡", text: "실시간 충전기 가용 여부 API 연동 (환경부 공공API)" },
    { icon: "📍", text: "충전소 정확 좌표 확보 → Kakao/Naver Geocoding API" },
    { icon: "🧭", text: "이동 경로 기반 충전소 추천 (네비게이션 연동)" },
    { icon: "🔮", text: "AI 기반 미래 충전 수요 예측 모델 적용" },
    { icon: "🇰🇷", text: "서울시 외 전국 광역시·도 확장" },
    { icon: "📱", text: "모바일 앱 버전 개발 (React Native 등)" },
  ];
  futures.forEach((f, i) => {
    s.addText(`${f.icon}  ${f.text}`, {
      x: 5.25, y: 1.88 + i * 0.57, w: 4.2, h: 0.52,
      fontSize: 11, color: C.offWhite, margin: 0
    });
  });
}

// ════════════════════════════════════════════════════════
// SLIDE 13: Q&A
// ════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.darkBg };

  // Decorative
  s.addShape(pres.shapes.OVAL, {
    x: -1.5, y: 3.5, w: 5, h: 5,
    fill: { color: C.accent2, transparency: 90 }, line: { color: C.accent2, width: 0.5 }
  });
  s.addShape(pres.shapes.OVAL, {
    x: 8, y: -1, w: 3.5, h: 3.5,
    fill: { color: C.accent1, transparency: 88 }, line: { color: C.accent1, width: 0.5 }
  });

  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 0.25, h: 5.625,
    fill: { color: C.accent1 }, line: { color: C.accent1 }
  });

  s.addText("Q & A", {
    x: 1, y: 1.3, w: 8, h: 1.4,
    fontSize: 64, bold: true, color: C.white, align: "center", margin: 0
  });

  s.addShape(pres.shapes.LINE, {
    x: 2.5, y: 3.0, w: 5, h: 0,
    line: { color: "253E6A", width: 1.5 }
  });

  s.addText("감사합니다", {
    x: 1, y: 3.15, w: 8, h: 0.65,
    fontSize: 26, color: C.offWhite, align: "center", margin: 0,
    fontFace: "Malgun Gothic"
  });

  s.addText("서울시 전기차 충전 인프라 부족 지역 분석 및 시각화 서비스", {
    x: 1, y: 3.9, w: 8, h: 0.45,
    fontSize: 13, color: C.muted, align: "center", italic: true, margin: 0
  });

  // Team info placeholder
  s.addShape(pres.shapes.RECTANGLE, {
    x: 3.0, y: 4.55, w: 4.0, h: 0.75,
    fill: { color: "0D1B35" }, line: { color: "253E6A", width: 0.8 }
  });
  s.addText("팀명 / 발표자 이름 입력", {
    x: 3.0, y: 4.55, w: 4.0, h: 0.75,
    fontSize: 12, color: C.muted, align: "center", valign: "middle",
    italic: true, margin: 0
  });

  addPageNum(s, 13, TOTAL, true);
}

// ─── Write file ───────────────────────────────────────────────────────────────
pres.writeFile({ fileName: "D:\\DevRefs\\ssu\\classes\\AI_Programming\\proj\\TeamProject\\서울시_EV_인프라분석_발표.pptx" })
  .then(() => console.log("✅ PPT 생성 완료: 서울시_EV_인프라분석_발표.pptx"))
  .catch(err => console.error("❌ 오류:", err));
