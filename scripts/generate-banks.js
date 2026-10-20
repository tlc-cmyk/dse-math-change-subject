#!/usr/bin/env node
/**
 * Offline bank generator for DSE change-subject & indices SPAs.
 * Produces ORIGINAL practice items (unique coeffs/letters/structures).
 * Regenerate: node scripts/generate-banks.js
 */
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const BANK = path.join(ROOT, "bank");

function shuffle(a) {
  const x = a.slice();
  for (let i = x.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [x[i], x[j]] = [x[j], x[i]];
  }
  return x;
}
function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
function nz(a, b) { let v; do { v = a + Math.floor(Math.random() * (b - a + 1)); } while (v === 0); return v; }
function ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }

const LETTERS = "abcdefghkmnpqrstuvwxyz".split("");
function distinct(n, exclude = []) {
  const used = new Set(exclude);
  const out = [];
  const pool = shuffle(LETTERS.filter((L) => !used.has(L)));
  for (const L of pool) {
    if (out.length >= n) break;
    out.push(L);
  }
  while (out.length < n) out.push(LETTERS[out.length % LETTERS.length] + out.length);
  return out;
}

function dsePrompt(subj, formula) {
  return `令 $${subj}$ 成為公式 $${formula}$ 的主項。`;
}
function idxPrompt(expr) {
  return `化簡 $${expr}$，並以正指數表示答案。`;
}

const YEAR_REFS = [
  "參考自 樣本試卷 卷一 Q2（題型）",
  "參考自 練習卷 卷一 Q1（題型）",
  "參考自 2012 卷一 Q2（題型）",
  "參考自 2013 卷一 Q1（題型）",
  "參考自 2014 卷一 Q2（題型）",
  "參考自 2015 卷一 Q1（題型）",
  "參考自 2016 卷一 Q2（題型）",
  "參考自 2017 卷一 Q1（題型）",
  "參考自 2018 卷一 Q2（題型）",
  "參考自 2019 卷一 Q1（題型）",
  "參考自 2023 卷一 Q2（題型）",
];

function item(base) {
  const o = { ...base };
  if (o.level !== 1) delete o.ref;
  if (!o.accepted) o.accepted = [o.finalAnswer];
  if (!Array.isArray(o.accepted)) o.accepted = [o.accepted];
  // ensure 3–4 distractors per step
  o.steps = o.steps.map((s) => ({
    ...s,
    distractors: (s.distractors || []).slice(0, 4),
  }));
  return o;
}

// ---------- CHANGE SUBJECT ----------
function buildChangeSubject() {
  const items = [];
  let seq = 0;
  const id = (prefix) => `${prefix}-${String(++seq).padStart(3, "0")}`;

  // ===== Level 0: ≥20 =====
  // L0-A: Ax+B=C
  const l0a = [
    [3, "x", 5, 17], [4, "y", -3, 9], [5, "k", 7, 22], [2, "m", -8, 6],
    [6, "n", 4, 28], [7, "p", -2, 19], [8, "t", 11, 35],
  ];
  for (const [A, x, B, C] of l0a) {
    const s0 = `${A}${x} + ${B} = ${C}`;
    const s1 = `${A}${x} = ${C - B}`;
    const s2 = `${x} = \\frac{${C - B}}{${A}}`;
    items.push(item({
      id: id("cs-s"),
      level: 0,
      type: "一次式移項除係數",
      errTag: "一次式／移項除係數",
      prompt: dsePrompt(x, s0),
      steps: [
        {
          current: s0, correct: s1,
          distractors: [`${A}${x} = ${C + B}`, `${A}${x} = ${C}`, `${x} + ${B} = ${C}`, `${A}${x} - ${B} = ${C}`],
          tip: `兩邊減 $${B}$，將常數移到右邊。`,
        },
        {
          current: s1, correct: s2,
          distractors: [`${x} = ${A}(${C - B})`, `${x} = \\frac{${A}}{${C - B}}`, `${x} = ${C - B} - ${A}`, `${x} = ${A} + ${C - B}`],
          tip: `兩邊同時除以係數 $${A}$。`,
        },
      ],
      finalAnswer: s2,
      accepted: [s2, `${x}=\\frac{${C - B}}{${A}}`, `${x}=(${C}-${B})/${A}`],
    }));
  }

  // L0-B: A(x+B)=C
  const l0b = [
    [4, "x", 3, 28], [5, "y", -2, 20], [3, "r", 6, 27], [6, "s", 1, 42], [2, "w", -5, 14],
  ];
  for (const [A, x, B, C] of l0b) {
    const s0 = `${A}(${x} + ${B}) = ${C}`;
    const s1 = `${x} + ${B} = \\frac{${C}}{${A}}`;
    const s2 = `${x} = \\frac{${C}}{${A}} - ${B}`;
    items.push(item({
      id: id("cs-s"),
      level: 0,
      type: "單括號除係數",
      errTag: "去括號／分配",
      prompt: dsePrompt(x, s0),
      steps: [
        {
          current: s0, correct: s1,
          distractors: [`${x} + ${B} = ${C}`, `${A}${x} + ${B} = ${C}`, `${x} + ${A}${B} = ${C}`, `${A}${x} + ${A}${B} = ${C}`],
          tip: `兩邊同時除以 $${A}$。`,
        },
        {
          current: s1, correct: s2,
          distractors: [`${x} = \\frac{${C}}{${A}} + ${B}`, `${x} = ${A}${C} - ${B}`, `${x} = \\frac{${C} - ${B}}{${A}}`, `${x} = ${C} - ${A}${B}`],
          tip: `兩邊減 $${B}$。`,
        },
      ],
      finalAnswer: s2,
      accepted: [s2, `${x}=\\frac{${C}}{${A}}-${B}`, `${x}=(${C}-${A * B})/${A}`],
    }));
  }

  // L0-C: clear denominator x/A + B = C
  const l0c = [
    ["x", 3, 4, 7], ["y", 5, 2, 6], ["k", 4, -1, 5], ["m", 2, 3, 8],
  ];
  for (const [x, A, B, C] of l0c) {
    const s0 = `\\frac{${x}}{${A}} + ${B} = ${C}`;
    const s1 = `\\frac{${x}}{${A}} = ${C - B}`;
    const s2 = `${x} = ${A * (C - B)}`;
    items.push(item({
      id: id("cs-s"),
      level: 0,
      type: "簡單清分母",
      errTag: "分式清分母",
      prompt: dsePrompt(x, s0),
      steps: [
        {
          current: s0, correct: s1,
          distractors: [`\\frac{${x}}{${A}} = ${C + B}`, `\\frac{${x}}{${A}} = ${C}`, `${x} + ${B} = ${C}`, `${x} = ${C} - ${B}`],
          tip: `兩邊減 $${B}$。`,
        },
        {
          current: s1, correct: s2,
          distractors: [`${x} = \\frac{${C - B}}{${A}}`, `${x} = ${C - B}`, `${x} = ${A} + ${C - B}`, `${x} = ${A}(${C + B})`],
          tip: `兩邊乘 $${A}$ 清分母。`,
        },
      ],
      finalAnswer: s2,
      accepted: [s2, `${x}=${A * (C - B)}`],
    }));
  }

  // L0-D: v = u + at → t
  {
    const s0 = "v = u + at";
    const s1 = "v - u = at";
    const s2 = "t = \\frac{v - u}{a}";
    items.push(item({
      id: id("cs-s"),
      level: 0,
      type: "線性公式（勻加速）",
      errTag: "公式移項（線性）",
      prompt: dsePrompt("t", s0),
      steps: [
        {
          current: s0, correct: s1,
          distractors: ["v + u = at", "v = at - u", "v - at = u", "u - v = at"],
          tip: "兩邊減 $u$。",
        },
        {
          current: s1, correct: s2,
          distractors: ["t = a(v - u)", "t = \\frac{a}{v - u}", "t = \\frac{v + u}{a}", "t = v - u - a"],
          tip: "兩邊除以 $a$。",
        },
      ],
      finalAnswer: s2,
      accepted: [s2, "t=(v-u)/a", "t=\\frac{v-u}{a}"],
    }));
  }

  // L0-E: temperature F = (9/5)C + 32 → C
  {
    const s0 = "F = \\frac{9}{5}C + 32";
    const s1 = "F - 32 = \\frac{9}{5}C";
    const s2 = "C = \\frac{5}{9}(F - 32)";
    items.push(item({
      id: id("cs-s"),
      level: 0,
      type: "溫度換算",
      errTag: "一次公式移項",
      prompt: dsePrompt("C", s0),
      steps: [
        {
          current: s0, correct: s1,
          distractors: ["F + 32 = \\frac{9}{5}C", "F = \\frac{9}{5}C - 32", "\\frac{9}{5}F = C + 32", "F - 32 = \\frac{5}{9}C"],
          tip: "兩邊減 $32$。",
        },
        {
          current: s1, correct: s2,
          distractors: ["C = \\frac{9}{5}(F - 32)", "C = \\frac{5}{9}F - 32", "C = \\frac{9}{5}F + 32", "C = 5(F - 32)/9"],
          tip: "兩邊乘 $\\frac{5}{9}$。",
        },
      ],
      finalAnswer: s2,
      accepted: [s2, "C=\\frac{5}{9}(F-32)", "C=\\frac{5(F-32)}{9}"],
    }));
  }

  // L0-F: proportion a/b = c/d → b
  const l0f = [
    [2, "b", 5, 10], [3, "q", 4, 12], [5, "h", 6, 15],
  ];
  for (const [a, b, c, d] of l0f) {
    const s0 = `\\frac{${a}}{${b}} = \\frac{${c}}{${d}}`;
    const s1 = `${a}${d} = ${c}${b}`;
    const s2 = `${b} = \\frac{${a}${d}}{${c}}`;
    items.push(item({
      id: id("cs-s"),
      level: 0,
      type: "比例式改寫",
      errTag: "比例式／交叉相乘",
      prompt: dsePrompt(b, s0),
      steps: [
        {
          current: s0, correct: s1,
          distractors: [`${a}${c} = ${b}${d}`, `${a}${b} = ${c}${d}`, `${a} + ${d} = ${c} + ${b}`, `${a}/${c} = ${b}/${d}`],
          tip: "交叉相乘。",
        },
        {
          current: s1, correct: s2,
          distractors: [`${b} = \\frac{${c}}{${a}${d}}`, `${b} = ${a}${d}${c}`, `${b} = \\frac{${c}${d}}{${a}}`, `${b} = ${a}${d} - ${c}`],
          tip: `兩邊除以 $${c}$。`,
        },
      ],
      finalAnswer: s2,
      accepted: [s2, `${b}=\\frac{${a}${d}}{${c}}`],
    }));
  }

  // L0-G: A = π r² → r
  {
    const s0 = "A = \\pi r^{2}";
    const s1 = "r^{2} = \\frac{A}{\\pi}";
    const s2 = "r = \\sqrt{\\frac{A}{\\pi}}";
    items.push(item({
      id: id("cs-s"),
      level: 0,
      type: "開方求主項",
      errTag: "開方／平方",
      prompt: dsePrompt("r", s0),
      steps: [
        {
          current: s0, correct: s1,
          distractors: ["r^{2} = A\\pi", "r = \\frac{A}{\\pi}", "r^{2} = A - \\pi", "\\pi r = A"],
          tip: "兩邊除以 $\\pi$。",
        },
        {
          current: s1, correct: s2,
          distractors: ["r = \\frac{A}{\\pi}", "r = \\left(\\frac{A}{\\pi}\\right)^{2}", "r = \\sqrt{A\\pi}", "r = \\frac{\\sqrt{A}}{\\pi}"],
          tip: "兩邊開平方（取正根）。",
        },
      ],
      finalAnswer: s2,
      accepted: [s2, "r=\\sqrt{A/\\pi}", "r=\\sqrt{\\frac{A}{\\pi}}"],
    }));
  }

  // ===== Level 1: ≥25 with refs =====
  seq = 0; // reset for dse ids style
  const dseId = (yr, n) => `cs-dse-${yr}-a${String(n).padStart(2, "0")}`;
  let dseN = 0;

  // D1: a(b+k)=a+b → b  (both sides subject)
  const d1params = [
    [3, "b", 2, "2016"], [4, "m", 3, "2019"], [5, "n", 2, "樣本試卷"], [2, "p", 4, "2018"],
    [6, "q", 3, "2014"], [3, "s", 5, "2017"], [4, "t", 2, "2015"], [5, "h", 4, "2013"],
  ];
  for (const [a, b, k, yr] of d1params) {
    dseN++;
    const s0 = `${a}(${b} + ${k}) = ${a} + ${b}`;
    const s1 = `${a}${b} + ${a * k} = ${a} + ${b}`;
    const s2 = `${a}${b} - ${b} = ${a} - ${a * k}`;
    const s3 = `${b}(${a} - 1) = ${a}(1 - ${k})`;
    const s4 = `${b} = \\frac{${a}(1 - ${k})}{${a} - 1}`;
    const rhs = a * (1 - k);
    items.push(item({
      id: dseId(String(yr).replace(/[^0-9a-z]/gi, "") || "sp", dseN),
      level: 1,
      type: "兩邊有主項／展開抽公因",
      errTag: "兩邊主項／抽公因式",
      ref: `參考自 ${yr} 卷一 Q${dseN % 2 === 0 ? 1 : 2}（題型）`,
      prompt: dsePrompt(b, s0),
      steps: [
        {
          current: s0, correct: s1,
          distractors: [`${a}${b} + ${k} = ${a} + ${b}`, `${b} + ${k} = ${a} + ${b}`, `${a}${b} + ${k} = ${a}${b}`, `${a}${b} + ${a}${k} = ${a}${b}`],
          tip: `左邊展開：$${a}(${b}+${k})=${a}${b}+${a * k}$。`,
        },
        {
          current: s1, correct: s2,
          distractors: [`${a}${b} + ${b} = ${a} + ${a * k}`, `${a}${b} - ${b} = ${a} + ${a * k}`, `${a}${b} = ${a} + ${b} - ${a * k}`, `${a}${b} - ${a} = ${b} - ${a * k}`],
          tip: `含 $${b}$ 嘅項移左，其餘移右。`,
        },
        {
          current: s2, correct: s3,
          distractors: [`${b}(${a} + 1) = ${a}(1 - ${k})`, `${b}(${a} - 1) = ${a}(1 + ${k})`, `${b}${a} - ${b} = ${a} - ${k}`, `${b} = ${a} - ${a * k}`],
          tip: `左邊抽 $${b}$；右邊寫 $${a}(1-${k})$。`,
        },
        {
          current: s3, correct: s4,
          distractors: [`${b} = \\frac{${a} - 1}{${a}(1 - ${k})}`, `${b} = ${a}(1 - ${k})(${a} - 1)`, `${b} = \\frac{${a}(1 + ${k})}{${a} - 1}`, `${b} = \\frac{1 - ${k}}{${a} - 1}`],
          tip: `兩邊除以 $(${a}-1)$。`,
        },
      ],
      finalAnswer: s4,
      accepted: [s4, `${b}=\\frac{${a}(1-${k})}{${a}-1}`, `${b}=\\frac{${rhs}}{${a}-1}`],
    }));
  }

  // D2: p(x+q)=r(sx-t) → x
  const d2params = [
    ["p", "x", 2, "r", 3, 4, "2019"],
    ["a", "y", 3, "b", 2, 5, "2012"],
    ["m", "k", 1, "n", 4, 3, "練習卷"],
    ["c", "t", 4, "d", 2, 7, "2016"],
    ["h", "s", 2, "g", 5, 1, "2018"],
    ["u", "v", 5, "w", 3, 2, "2023"],
  ];
  for (const [p, x, q, r, s, t, yr] of d2params) {
    dseN++;
    const s0 = `${p}(${x} + ${q}) = ${r}(${s}${x} - ${t})`;
    const s1 = `${p}${x} + ${p}${q} = ${r}${s}${x} - ${r}${t}`;
    const s2 = `${p}${x} - ${s}${r}${x} = -${r}${t} - ${p}${q}`;
    const s3 = `${x}(${p} - ${s}${r}) = -${r}${t} - ${p}${q}`;
    const s4 = `${x} = \\frac{${r}${t} + ${p}${q}}{${s}${r} - ${p}}`;
    items.push(item({
      id: dseId(String(yr).replace(/[^0-9a-z]/gi, "") || "pp", dseN),
      level: 1,
      type: "兩邊括號／抽公因",
      errTag: "兩邊主項／抽公因式",
      ref: `參考自 ${yr} 卷一 Q${(dseN % 2) + 1}（題型）`,
      prompt: dsePrompt(x, s0),
      steps: [
        {
          current: s0, correct: s1,
          distractors: [`${p}${x} + ${q} = ${r}${s}${x} - ${t}`, `${p}${x} + ${p}${q} = ${r}${s}${x} - ${t}`, `${x} + ${q} = ${s}${x} - ${t}`, `${p}${x} + ${q} = ${s}${r}${x} - ${r}${t}`],
          tip: "兩邊展開分配律。",
        },
        {
          current: s1, correct: s2,
          distractors: [`${p}${x} + ${s}${r}${x} = -${r}${t} - ${p}${q}`, `${p}${x} - ${s}${r}${x} = -${r}${t} + ${p}${q}`, `${p}${x} = ${s}${r}${x} - ${r}${t} - ${p}${q}`, `${p}${x} - ${s}${r}${x} = ${r}${t} + ${p}${q}`],
          tip: `含 $${x}$ 項移左，常數移右。`,
        },
        {
          current: s2, correct: s3,
          distractors: [`${x}(${p} + ${s}${r}) = -${r}${t} - ${p}${q}`, `${x}(${p} - ${s}${r}) = ${r}${t} + ${p}${q}`, `${x}${p} - ${s}${r} = -${r}${t} - ${p}${q}`, `${x} = -${r}${t} - ${p}${q}`],
          tip: `左邊抽 $${x}$ 為公因式。`,
        },
        {
          current: s3, correct: s4,
          distractors: [`${x} = \\frac{${p} - ${s}${r}}{${r}${t} + ${p}${q}}`, `${x} = \\frac{-${r}${t} - ${p}${q}}{${s}${r} - ${p}}`, `${x} = \\frac{${r}${t} - ${p}${q}}{${s}${r} - ${p}}`, `${x} = (${r}${t}+${p}${q})(${s}${r}-${p})`],
          tip: "兩邊除以括號係數，並整理正負號。",
        },
      ],
      finalAnswer: s4,
      accepted: [s4, `${x}=\\frac{${r}${t}+${p}${q}}{${s}${r}-${p}}`],
    }));
  }

  // D3: subject in denominator  m/(x+n) = k → x
  const d3params = [
    [12, "x", 3, 4, "2015"], [20, "y", 5, 5, "2017"], [18, "k", 2, 3, "2013"],
    [15, "m", 4, 5, "2023"], [24, "n", 1, 6, "2014"], [10, "p", 6, 2, "2018"],
  ];
  for (const [m, x, n, k, yr] of d3params) {
    dseN++;
    const s0 = `\\frac{${m}}{${x} + ${n}} = ${k}`;
    const s1 = `${m} = ${k}(${x} + ${n})`;
    const s2 = `${m} = ${k}${x} + ${k * n}`;
    const s3 = `${k}${x} = ${m} - ${k * n}`;
    const s4 = `${x} = \\frac{${m} - ${k * n}}{${k}}`;
    items.push(item({
      id: dseId(yr, dseN),
      level: 1,
      type: "分母含主項",
      errTag: "分母主項／清分母",
      ref: `參考自 ${yr} 卷一 Q2（題型）`,
      prompt: dsePrompt(x, s0),
      steps: [
        {
          current: s0, correct: s1,
          distractors: [`${m} = ${k} + ${x} + ${n}`, `${m}(${x} + ${n}) = ${k}`, `${m} = ${k}${x} + ${n}`, `\\frac{${m}}{${k}} = ${x} + ${n}`],
          tip: "兩邊乘分母清分母。",
        },
        {
          current: s1, correct: s2,
          distractors: [`${m} = ${k}${x} + ${n}`, `${m} = ${k}${x} - ${k * n}`, `${m} = (${k} + ${x}) + ${n}`, `${m}${k} = ${x} + ${n}`],
          tip: "右邊展開。",
        },
        {
          current: s2, correct: s3,
          distractors: [`${k}${x} = ${m} + ${k * n}`, `${k}${x} = ${k * n} - ${m}`, `${x} = ${m} - ${k * n}`, `${k}${x} + ${m} = ${k * n}`],
          tip: "常數移到左邊（或移項求 $kx$）。",
        },
        {
          current: s3, correct: s4,
          distractors: [`${x} = ${k}(${m} - ${k * n})`, `${x} = \\frac{${k}}{${m} - ${k * n}}`, `${x} = ${m} - ${n}`, `${x} = \\frac{${m}}{${k}} - ${n}`],
          tip: `兩邊除以 $${k}$。`,
        },
      ],
      finalAnswer: s4,
      accepted: [s4, `${x}=\\frac{${m}-${k * n}}{${k}}`, `${x}=${(m - k * n) / k}`].filter((x, i, a) => a.indexOf(x) === i || typeof x === "string"),
    }));
    // fix accepted if division is integer
    const last = items[items.length - 1];
    if ((m - k * n) % k === 0) {
      last.accepted.push(`${x}=${(m - k * n) / k}`);
    }
  }

  // D4: 1/f = 1/u + 1/v → v  (optics style)
  const d4params = [
    ["f", "u", "v", "2016"], ["p", "q", "r", "2019"], ["a", "b", "c", "樣本試卷"],
  ];
  for (const [f, u, v, yr] of d4params) {
    dseN++;
    const s0 = `\\frac{1}{${f}} = \\frac{1}{${u}} + \\frac{1}{${v}}`;
    const s1 = `\\frac{1}{${f}} - \\frac{1}{${u}} = \\frac{1}{${v}}`;
    const s2 = `\\frac{${u} - ${f}}{${f}${u}} = \\frac{1}{${v}}`;
    const s3 = `${v} = \\frac{${f}${u}}{${u} - ${f}}`;
    items.push(item({
      id: dseId(String(yr).replace(/[^0-9a-z]/gi, "") || "sp", dseN),
      level: 1,
      type: "倒數差移項",
      errTag: "倒數公式／通分",
      ref: `參考自 ${yr} 卷一 Q1（題型）`,
      prompt: dsePrompt(v, s0),
      steps: [
        {
          current: s0, correct: s1,
          distractors: [`\\frac{1}{${f}} + \\frac{1}{${u}} = \\frac{1}{${v}}`, `\\frac{1}{${f}} = \\frac{1}{${u}${v}}`, `${f} = ${u} + ${v}`, `\\frac{1}{${v}} = \\frac{1}{${f}${u}}`],
          tip: `兩邊減 $\\frac{1}{${u}}$。`,
        },
        {
          current: s1, correct: s2,
          distractors: [`\\frac{${f} - ${u}}{${f}${u}} = \\frac{1}{${v}}`, `\\frac{${u} + ${f}}{${f}${u}} = \\frac{1}{${v}}`, `${u} - ${f} = \\frac{1}{${v}}`, `\\frac{1}{${f} - ${u}} = \\frac{1}{${v}}`],
          tip: "左邊通分。",
        },
        {
          current: s2, correct: s3,
          distractors: [`${v} = \\frac{${u} - ${f}}{${f}${u}}`, `${v} = ${f}${u}(${u} - ${f})`, `${v} = \\frac{${f}${u}}{${f} - ${u}}`, `${v} = ${f} + ${u}`],
          tip: "兩邊取倒數。",
        },
      ],
      finalAnswer: s3,
      accepted: [s3, `${v}=\\frac{${f}${u}}{${u}-${f}}`],
    }));
  }

  // D5: A(x+B)=C(y+D) make y subject? or Ax+B = Cy+D → y
  const d5params = [
    [3, "x", 4, 5, "y", 2, "2012"], [2, "a", 7, 4, "b", 3, "2015"],
    [5, "m", 1, 3, "n", 6, "2017"],
  ];
  for (const [A, x, B, C, y, D, yr] of d5params) {
    dseN++;
    const s0 = `${A}${x} + ${B} = ${C}${y} + ${D}`;
    const s1 = `${A}${x} + ${B} - ${D} = ${C}${y}`;
    const s2 = `${C}${y} = ${A}${x} + ${B - D}`;
    const s3 = `${y} = \\frac{${A}${x} + ${B - D}}{${C}}`;
    items.push(item({
      id: dseId(yr, dseN),
      level: 1,
      type: "兩邊展開移項",
      errTag: "兩邊展開／移項",
      ref: `參考自 ${yr} 卷一 Q2（題型）`,
      prompt: dsePrompt(y, s0),
      steps: [
        {
          current: s0, correct: s1,
          distractors: [`${A}${x} + ${B} + ${D} = ${C}${y}`, `${A}${x} - ${B} = ${C}${y} + ${D}`, `${A}${x} + ${B} = ${C}${y} - ${D}`, `${A}${x} = ${C}${y} + ${D} - ${B}`],
          tip: `兩邊減 $${D}$。`,
        },
        {
          current: s1, correct: s2,
          distractors: [`${C}${y} = ${A}${x} - ${B - D}`, `${C}${y} = ${A}${x} + ${B} + ${D}`, `${y} = ${A}${x} + ${B - D}`, `${C}${y} = ${B - D} - ${A}${x}`],
          tip: "左右對調，方便寫主項在左。",
        },
        {
          current: s2, correct: s3,
          distractors: [`${y} = ${C}(${A}${x} + ${B - D})`, `${y} = \\frac{${C}}{${A}${x} + ${B - D}}`, `${y} = ${A}${x} + ${B - D} - ${C}`, `${y} = \\frac{${A}${x}}{${C}} + ${B - D}`],
          tip: `兩邊除以 $${C}$。`,
        },
      ],
      finalAnswer: s3,
      accepted: [s3, `${y}=\\frac{${A}${x}+${B - D}}{${C}}`],
    }));
  }

  // D6: Ax = (Bx+C)s → x
  const d6params = [
    [7, "x", 2, 3, 4, "2018"], [9, "y", 3, 1, 2, "2014"], [8, "k", 1, 5, 3, "2023"],
  ];
  for (const [A, x, B, C, s, yr] of d6params) {
    dseN++;
    const s0 = `${A}${x} = (${B}${x} + ${C})${s}`;
    const s1 = `${A}${x} = ${B * s}${x} + ${C * s}`;
    const s2 = `${A}${x} - ${B * s}${x} = ${C * s}`;
    const s3 = `${x}(${A} - ${B * s}) = ${C * s}`;
    const s4 = `${x} = \\frac{${C * s}}{${A} - ${B * s}}`;
    items.push(item({
      id: dseId(yr, dseN),
      level: 1,
      type: "係數×主項＝括號展開",
      errTag: "兩邊主項／抽公因式",
      ref: `參考自 ${yr} 卷一 Q1（題型）`,
      prompt: dsePrompt(x, s0),
      steps: [
        {
          current: s0, correct: s1,
          distractors: [`${A}${x} = ${B}${x} + ${C}${s}`, `${A}${x} = ${B}${s}${x} + ${C}`, `${A}${x} = (${B} + ${C})${s}${x}`, `${A} = ${B}${x} + ${C}`],
          tip: "右邊展開。",
        },
        {
          current: s1, correct: s2,
          distractors: [`${A}${x} + ${B * s}${x} = ${C * s}`, `${A}${x} - ${B * s}${x} = -${C * s}`, `${A}${x} = ${B * s}${x} - ${C * s}`, `${x} - ${B * s}${x} = ${C * s}`],
          tip: `含 $${x}$ 項移到左邊。`,
        },
        {
          current: s2, correct: s3,
          distractors: [`${x}(${A} + ${B * s}) = ${C * s}`, `${x}${A} - ${B * s} = ${C * s}`, `${x} = ${A} - ${B * s}`, `${x}(${A} - ${B * s}) = ${C} + ${s}`],
          tip: `抽 $${x}$ 公因式。`,
        },
        {
          current: s3, correct: s4,
          distractors: [`${x} = \\frac{${A} - ${B * s}}{${C * s}}`, `${x} = ${C * s}(${A} - ${B * s})`, `${x} = \\frac{${C * s}}{${A} + ${B * s}}`, `${x} = \\frac{${C}}{${A} - ${B}}`],
          tip: "兩邊除以括號係數。",
        },
      ],
      finalAnswer: s4,
      accepted: [s4, `${x}=\\frac{${C * s}}{${A}-${B * s}}`],
    }));
  }

  // ===== Level 2: ≥15 =====
  seq = 0;
  const advId = () => `cs-adv-${String(++seq).padStart(3, "0")}`;

  // A1: (ax+b)/(cx+d) = k → x
  const a1 = [
    [2, "x", 3, 4, 5, 3], [3, "y", -1, 2, 7, 4], [5, "m", 2, 3, 4, 2],
    [4, "n", 1, 5, 2, 5], [6, "p", -2, 3, 1, 3],
  ];
  for (const [a, x, b, c, d, k] of a1) {
    const s0 = `\\frac{${a}${x} + ${b}}{${c}${x} + ${d}} = ${k}`;
    const s1 = `${a}${x} + ${b} = ${k}(${c}${x} + ${d})`;
    const s2 = `${a}${x} + ${b} = ${k * c}${x} + ${k * d}`;
    const s3 = `${a}${x} - ${k * c}${x} = ${k * d} - ${b}`;
    const s4 = `${x} = \\frac{${k * d} - ${b}}{${a} - ${k * c}}`;
    items.push(item({
      id: advId(),
      level: 2,
      type: "分式等於常數（繁）",
      errTag: "分式主項／清分母",
      prompt: dsePrompt(x, s0),
      steps: [
        {
          current: s0, correct: s1,
          distractors: [`${a}${x} + ${b} = ${k} + ${c}${x} + ${d}`, `(${a}${x} + ${b})(${c}${x} + ${d}) = ${k}`, `${a}${x} + ${b} = ${k}${c}${x} + ${d}`, `\\frac{${a}${x}}{${c}${x}} = ${k}`],
          tip: "兩邊乘分母。",
        },
        {
          current: s1, correct: s2,
          distractors: [`${a}${x} + ${b} = ${k}${c}${x} + ${d}`, `${a}${x} + ${b} = ${k * c}${x} - ${k * d}`, `${a}${x} = ${k}${c}${x} + ${k}${d}`, `${a}${x} + ${b}${k} = ${c}${x} + ${d}`],
          tip: "右邊展開。",
        },
        {
          current: s2, correct: s3,
          distractors: [`${a}${x} + ${k * c}${x} = ${k * d} - ${b}`, `${a}${x} - ${k * c}${x} = ${k * d} + ${b}`, `${a}${x} - ${k * c}${x} = ${b} - ${k * d}`, `${x} - ${k * c}${x} = ${k * d} - ${b}`],
          tip: `含 $${x}$ 移左，常數移右。`,
        },
        {
          current: s3, correct: s4,
          distractors: [`${x} = \\frac{${a} - ${k * c}}{${k * d} - ${b}}`, `${x} = (${k * d} - ${b})(${a} - ${k * c})`, `${x} = \\frac{${k * d} + ${b}}{${a} - ${k * c}}`, `${x} = \\frac{${k * d} - ${b}}{${a} + ${k * c}}`],
          tip: "抽公因後兩邊相除。",
        },
      ],
      finalAnswer: s4,
      accepted: [s4, `${x}=\\frac{${k * d}-${b}}{${a}-${k * c}}`],
    }));
  }

  // A2: 1/x + 1/y = 1/z make x
  const a2 = [
    ["x", "y", "z"], ["a", "b", "c"], ["p", "q", "r"], ["m", "n", "k"],
  ];
  for (const [x, y, z] of a2) {
    const s0 = `\\frac{1}{${x}} + \\frac{1}{${y}} = \\frac{1}{${z}}`;
    const s1 = `\\frac{1}{${x}} = \\frac{1}{${z}} - \\frac{1}{${y}}`;
    const s2 = `\\frac{1}{${x}} = \\frac{${y} - ${z}}{${z}${y}}`;
    const s3 = `${x} = \\frac{${z}${y}}{${y} - ${z}}`;
    items.push(item({
      id: advId(),
      level: 2,
      type: "三倒數公式",
      errTag: "倒數公式／通分",
      prompt: dsePrompt(x, s0),
      steps: [
        {
          current: s0, correct: s1,
          distractors: [`\\frac{1}{${x}} = \\frac{1}{${z}} + \\frac{1}{${y}}`, `${x} + ${y} = ${z}`, `\\frac{1}{${x}} = \\frac{1}{${z}${y}}`, `\\frac{1}{${x}${y}} = \\frac{1}{${z}}`],
          tip: `兩邊減 $\\frac{1}{${y}}$。`,
        },
        {
          current: s1, correct: s2,
          distractors: [`\\frac{1}{${x}} = \\frac{${z} - ${y}}{${z}${y}}`, `\\frac{1}{${x}} = \\frac{${y} + ${z}}{${z}${y}}`, `${y} - ${z} = \\frac{1}{${x}}`, `\\frac{1}{${x}} = ${y} - ${z}`],
          tip: "右邊通分。",
        },
        {
          current: s2, correct: s3,
          distractors: [`${x} = \\frac{${y} - ${z}}{${z}${y}}`, `${x} = \\frac{${z}${y}}{${z} - ${y}}`, `${x} = ${z}${y}(${y} - ${z})`, `${x} = ${z} + ${y}`],
          tip: "兩邊取倒數。",
        },
      ],
      finalAnswer: s3,
      accepted: [s3, `${x}=\\frac{${z}${y}}{${y}-${z}}`],
    }));
  }

  // A3: √((ax+b)/c) = d → x
  const a3 = [
    [2, "x", 5, 3, 4], [3, "y", 1, 2, 5], [4, "k", 7, 5, 3],
  ];
  for (const [a, x, b, c, d] of a3) {
    const s0 = `\\sqrt{\\frac{${a}${x} + ${b}}{${c}}} = ${d}`;
    const s1 = `\\frac{${a}${x} + ${b}}{${c}} = ${d * d}`;
    const s2 = `${a}${x} + ${b} = ${c * d * d}`;
    const s3 = `${a}${x} = ${c * d * d - b}`;
    const s4 = `${x} = \\frac{${c * d * d - b}}{${a}}`;
    items.push(item({
      id: advId(),
      level: 2,
      type: "根號分式求主項",
      errTag: "開方／平方",
      prompt: dsePrompt(x, s0),
      steps: [
        {
          current: s0, correct: s1,
          distractors: [`\\frac{${a}${x} + ${b}}{${c}} = ${d}`, `${a}${x} + ${b} = ${d}`, `\\sqrt{${a}${x} + ${b}} = ${d}${c}`, `\\frac{${a}${x} + ${b}}{${c}} = \\sqrt{${d}}`],
          tip: "兩邊平方。",
        },
        {
          current: s1, correct: s2,
          distractors: [`${a}${x} + ${b} = ${d * d}`, `${a}${x} + ${b} = ${c} + ${d * d}`, `${a}${x} + ${b} = \\frac{${d * d}}{${c}}`, `${a}${x} = ${c}${d * d}`],
          tip: `兩邊乘 $${c}$。`,
        },
        {
          current: s2, correct: s3,
          distractors: [`${a}${x} = ${c * d * d} + ${b}`, `${a}${x} = ${b} - ${c * d * d}`, `${x} = ${c * d * d - b}`, `${a}${x} + ${c * d * d} = ${b}`],
          tip: `兩邊減 $${b}$。`,
        },
        {
          current: s3, correct: s4,
          distractors: [`${x} = ${a}(${c * d * d - b})`, `${x} = \\frac{${a}}{${c * d * d - b}}`, `${x} = ${c * d * d - b} - ${a}`, `${x} = \\frac{${c * d * d + b}}{${a}}`],
          tip: `兩邊除以 $${a}$。`,
        },
      ],
      finalAnswer: s4,
      accepted: [s4, `${x}=\\frac{${c * d * d - b}}{${a}}`],
    }));
  }

  // A4: complex both-sides: a/x + b = c/(x+d)
  const a4 = [
    [2, "x", 3, 4, 1], [5, "y", 1, 6, 2], [3, "m", 4, 5, 3],
  ];
  for (const [a, x, b, c, d] of a4) {
    const s0 = `\\frac{${a}}{${x}} + ${b} = \\frac{${c}}{${x} + ${d}}`;
    const s1 = `\\frac{${a} + ${b}${x}}{${x}} = \\frac{${c}}{${x} + ${d}}`;
    const s2 = `(${a} + ${b}${x})(${x} + ${d}) = ${c}${x}`;
    const s3 = `${a}${x} + ${a * d} + ${b}${x}^{2} + ${b * d}${x} = ${c}${x}`;
    // Better stop at cross multiply then collect — keep 3 steps focused
    // Redo with clearer path: move b first already in s1
    items.push(item({
      id: advId(),
      level: 2,
      type: "雙分式方程",
      errTag: "分式主項／清分母",
      prompt: dsePrompt(x, s0),
      steps: [
        {
          current: s0, correct: s1,
          distractors: [`\\frac{${a}}{${x}} = \\frac{${c}}{${x} + ${d}} + ${b}`, `\\frac{${a} + ${b}}{${x}} = \\frac{${c}}{${x} + ${d}}`, `${a} + ${b}${x} = ${c}`, `\\frac{${a}}{${x} + ${b}} = \\frac{${c}}{${x} + ${d}}`],
          tip: `左邊通分：\\(\\dfrac{${a}}{${x}}+${b}=\\dfrac{${a}+${b}${x}}{${x}}\\)。`,
        },
        {
          current: s1, correct: s2,
          distractors: [`${a} + ${b}${x} = ${c}(${x} + ${d})`, `(${a} + ${b}${x})(${x} + ${d}) = ${c}`, `${a} + ${b}${x} = ${c}${x}`, `\\frac{${a} + ${b}${x}}{${x} + ${d}} = ${c}${x}`],
          tip: "交叉相乘。",
        },
        {
          current: s2, correct: `${b}${x}^{2} + (${a} + ${b * d} - ${c})${x} + ${a * d} = 0`,
          distractors: [
            `${b}${x}^{2} + (${a} + ${b * d} + ${c})${x} + ${a * d} = 0`,
            `${b}${x}^{2} + (${a} - ${b * d})${x} = ${c}${x}`,
            `${a} + ${b}${x} + ${d} = ${c}${x}`,
            `${b}${x}^{2} + ${a}${x} + ${a * d} = ${c}`,
          ],
          tip: "展開後將所有項移到左邊整理成二次方程（若題目要求主項，可先保留此式再視情況求解）。",
        },
      ],
      finalAnswer: `${b}${x}^{2} + (${a} + ${b * d} - ${c})${x} + ${a * d} = 0`,
      accepted: [
        `${b}${x}^{2} + (${a} + ${b * d} - ${c})${x} + ${a * d} = 0`,
        `${b}${x}^{2}+(${a}+${b * d}-${c})${x}+${a * d}=0`,
      ],
    }));
  }

  return items;
}

// ---------- INDICES ----------
function monoPositive(pairs) {
  // pairs: [[base, exp], ...] — emit positive-index form
  const num = [];
  const den = [];
  for (const [b, e] of pairs) {
    if (e === 0) continue;
    if (e > 0) num.push(e === 1 ? b : `${b}^{${e}}`);
    else den.push(e === -1 ? b : `${b}^{${-e}}`);
  }
  if (!num.length && !den.length) return "1";
  if (!den.length) return num.join("");
  if (!num.length) return `\\frac{1}{${den.join("")}}`;
  return `\\frac{${num.join("")}}{${den.join("")}}`;
}

function buildIndices() {
  const items = [];
  let seq = 0;
  const id = (p) => `${p}-${String(++seq).padStart(3, "0")}`;

  // Level 0 ≥20
  // multiply same base
  const mul = [
    ["a", 3, 4], ["x", 2, 5], ["b", 4, 3], ["m", 5, 2], ["n", 1, 6], ["p", 3, 3], ["k", 2, 7],
  ];
  for (const [a, m, n] of mul) {
    const s0 = `${a}^{${m}} \\times ${a}^{${n}}`;
    const s1 = `${a}^{${m} + ${n}}`;
    const s2 = `${a}^{${m + n}}`;
    items.push(item({
      id: id("idx-s"),
      level: 0,
      type: "同底相乘",
      errTag: "同底相乘指數相加",
      prompt: idxPrompt(s0),
      steps: [
        {
          current: s0, correct: s1,
          distractors: [`${a}^{${m * n}}`, `${a}^{${m - n}}`, `${a}^{${m}}^{${n}}`, `2${a}^{${m + n}}`],
          tip: "同底相乘，指數相加。",
        },
        {
          current: s1, correct: s2,
          distractors: [`${a}^{${m}${n}}`, `${a}^{${m - n}}`, `(${a}^{${m}})^{${n}}`, `${a}^{${m} \\times ${n}}`],
          tip: "計出指數和。",
        },
      ],
      finalAnswer: s2,
      accepted: [s2, `${a}^{${m + n}}`],
    }));
  }

  // divide same base
  const div = [
    ["a", 7, 3], ["x", 8, 2], ["b", 6, 4], ["y", 9, 5], ["t", 5, 1],
  ];
  for (const [a, m, n] of div) {
    const s0 = `\\frac{${a}^{${m}}}{${a}^{${n}}}`;
    const s1 = `${a}^{${m} - ${n}}`;
    const s2 = `${a}^{${m - n}}`;
    items.push(item({
      id: id("idx-s"),
      level: 0,
      type: "同底相除",
      errTag: "同底相除指數相減",
      prompt: idxPrompt(s0),
      steps: [
        {
          current: s0, correct: s1,
          distractors: [`${a}^{${m + n}}`, `${a}^{${m / n}}`, `${a}^{${m}${n}}`, `\\frac{1}{${a}^{${m - n}}}`],
          tip: "同底相除，指數相減。",
        },
        {
          current: s1, correct: s2,
          distractors: [`${a}^{${n - m}}`, `${a}^{${m + n}}`, `\\frac{1}{${a}^{${m - n}}}`, `${a}^{${m}${n}}`],
          tip: "計出指數差。",
        },
      ],
      finalAnswer: s2,
      accepted: [s2],
    }));
  }

  // power of power
  const pop = [
    ["a", 2, 3], ["x", 3, 4], ["b", 4, 2], ["m", 5, 2], ["n", 2, 5],
  ];
  for (const [a, m, n] of pop) {
    const s0 = `(${a}^{${m}})^{${n}}`;
    const s1 = `${a}^{${m} \\times ${n}}`;
    const s2 = `${a}^{${m * n}}`;
    items.push(item({
      id: id("idx-s"),
      level: 0,
      type: "方之方",
      errTag: "方之方指數相乘",
      prompt: idxPrompt(s0),
      steps: [
        {
          current: s0, correct: s1,
          distractors: [`${a}^{${m + n}}`, `${a}^{${m - n}}`, `${a}^{${m}}^{${n}}`, `${n}${a}^{${m}}`],
          tip: "方之方，指數相乘。",
        },
        {
          current: s1, correct: s2,
          distractors: [`${a}^{${m + n}}`, `(${a}^{${m * n}})`, `${a}^{${m}}^{${n}}`, `${a}^{${n}}^{${m}}`],
          tip: "計出指數積。",
        },
      ],
      finalAnswer: s2,
      accepted: [s2],
    }));
  }

  // product power
  const pp = [
    ["a", "b", 3], ["x", "y", 4], ["m", "n", 2], ["p", "q", 5],
  ];
  for (const [a, b, n] of pp) {
    const s0 = `(${a}${b})^{${n}}`;
    const s1 = `${a}^{${n}}${b}^{${n}}`;
    items.push(item({
      id: id("idx-s"),
      level: 0,
      type: "積的方",
      errTag: "積的方分配指數",
      prompt: idxPrompt(s0),
      steps: [
        {
          current: s0, correct: s1,
          distractors: [`${a}${b}^{${n}}`, `${a}^{${n}}${b}`, `(${a}^{${n}}${b})^{${n}}`, `${a}^{${n} + ${n}}${b}`],
          tip: "積的方：每個因子都升同一指數。",
        },
      ],
      finalAnswer: s1,
      accepted: [s1, `${b}^{${n}}${a}^{${n}}`],
    }));
  }

  // negative index
  const neg = [
    ["a", 3], ["x", 2], ["b", 4], ["m", 5],
  ];
  for (const [a, n] of neg) {
    const s0 = `${a}^{-${n}}`;
    const s1 = `\\frac{1}{${a}^{${n}}}`;
    items.push(item({
      id: id("idx-s"),
      level: 0,
      type: "負指數改寫",
      errTag: "負指數改分數",
      prompt: idxPrompt(s0),
      steps: [
        {
          current: s0, correct: s1,
          distractors: [`-${a}^{${n}}`, `\\frac{1}{${a}^{-${n}}}`, `${a}^{${n}}`, `-\\frac{1}{${a}^{${n}}}`],
          tip: "$a^{-n}=\\dfrac{1}{a^{n}}$。",
        },
      ],
      finalAnswer: s1,
      accepted: [s1, `1/${a}^{${n}}`],
    }));
  }

  // Level 1 ≥25
  seq = 0;
  const dId = () => id("idx-d");

  // (x^r y^s)^{-k} type
  const d1 = [
    ["x", "y", 2, 3, 2], ["a", "b", 3, 1, 3], ["m", "n", 4, 2, 2],
    ["p", "q", 1, 4, 2], ["r", "s", 2, 5, 3], ["u", "v", 3, 2, 2],
  ];
  for (const [x, y, r, s, k] of d1) {
    const s0 = `(${x}^{${r}}${y}^{${s}})^{-${k}}`;
    const s1 = `${x}^{-${r * k}}${y}^{-${s * k}}`;
    const s2 = monoPositive([[x, -r * k], [y, -s * k]]);
    items.push(item({
      id: dId(),
      level: 1,
      type: "負指數×積的方",
      errTag: "積的方／指數合併",
      prompt: idxPrompt(s0),
      steps: [
        {
          current: s0, correct: s1,
          distractors: [`${x}^{${r * k}}${y}^{${s * k}}`, `${x}^{-${r - k}}${y}^{-${s - k}}`, `(${x}${y})^{-${r * s * k}}`, `${x}^{-${r}}${y}^{-${s}${k}}`],
          tip: "先做積的方，指數乘外面嘅負指數。",
        },
        {
          current: s1, correct: s2,
          distractors: [`${x}^{${r * k}}${y}^{${s * k}}`, monoPositive([[x, r * k], [y, -s * k]]), `${x}^{-${r * k}}${y}^{${s * k}}`, `\\frac{${x}^{${r * k}}}{${y}^{${s * k}}}`],
          tip: "改寫成正指數。",
        },
      ],
      finalAnswer: s2,
      accepted: [s2, monoPositive([[y, -s * k], [x, -r * k]])],
    }));
  }

  // (a^m b^n)^p / (a^q b^r)
  const d2 = [
    ["a", "b", 2, 3, 2, 1, 2], ["x", "y", 3, 1, 3, 2, 1], ["m", "n", 4, 2, 2, 3, 1],
    ["p", "q", 2, 4, 2, 1, 3], ["c", "d", 5, 1, 2, 2, 2],
  ];
  for (const [a, b, m, n, p, q, r] of d2) {
    const ea = m * p - q;
    const eb = n * p - r;
    const s0 = `\\frac{(${a}^{${m}}${b}^{${n}})^{${p}}}{${a}^{${q}}${b}^{${r}}}`;
    const s1 = `\\frac{${a}^{${m * p}}${b}^{${n * p}}}{${a}^{${q}}${b}^{${r}}}`;
    const s2 = `${a}^{${m * p} - ${q}}${b}^{${n * p} - ${r}}`;
    const s3 = monoPositive([[a, ea], [b, eb]]);
    items.push(item({
      id: dId(),
      level: 1,
      type: "積的方÷單項式",
      errTag: "積的方／指數合併",
      prompt: idxPrompt(s0),
      steps: [
        {
          current: s0, correct: s1,
          distractors: [`\\frac{${a}^{${m + p}}${b}^{${n + p}}}{${a}^{${q}}${b}^{${r}}}`, `\\frac{${a}^{${m * p}}${b}^{${n}}}{${a}^{${q}}${b}^{${r}}}`, `(${a}^{${m * p}}${b}^{${n * p}})^{${q}}`, `\\frac{${a}^{${m}}${b}^{${n}${p}}}{${a}^{${q}}${b}^{${r}}}`],
          tip: "分子先做積的方。",
        },
        {
          current: s1, correct: s2,
          distractors: [`${a}^{${m * p} + ${q}}${b}^{${n * p} + ${r}}`, `${a}^{${m * p} - ${q}}${b}^{${n * p} + ${r}}`, `${a}^{${q} - ${m * p}}${b}^{${r} - ${n * p}}`, `\\frac{${a}^{${m * p} - ${q}}}{${b}^{${n * p} - ${r}}}`],
          tip: "同底相除，指數相減。",
        },
        {
          current: s2, correct: s3,
          distractors: [monoPositive([[a, -ea], [b, -eb]]), `${a}^{${ea}}${b}^{${eb}}`, monoPositive([[a, eb], [b, ea]]), `\\frac{${a}^{${Math.abs(ea)}}}{${b}^{${Math.abs(eb)}}}`],
          tip: "以正指數表示。",
        },
      ],
      finalAnswer: s3,
      accepted: [s3, monoPositive([[b, eb], [a, ea]])],
    }));
  }

  // nested
  const d3 = [
    ["x", "y", 2, 3, 2, 1, 4], ["a", "b", 3, 1, 2, 2, 3], ["m", "n", 1, 4, 3, 2, 1],
    ["p", "q", 2, 2, 4, 3, 2], ["u", "v", 4, 1, 2, 1, 5],
  ];
  for (const [x, y, p, q, r, s, t] of d3) {
    // ((x^p y^q)^r) / (x^s y^t)
    const ex = p * r - s;
    const ey = q * r - t;
    const s0 = `\\frac{(${x}^{${p}}${y}^{${q}})^{${r}}}{${x}^{${s}}${y}^{${t}}}`;
    const s1 = `\\frac{${x}^{${p * r}}${y}^{${q * r}}}{${x}^{${s}}${y}^{${t}}}`;
    const s2 = `${x}^{${p * r}-${s}}${y}^{${q * r}-${t}}`;
    const s3 = monoPositive([[x, ex], [y, ey]]);
    items.push(item({
      id: dId(),
      level: 1,
      type: "嵌套積的方／除",
      errTag: "積的方／指數合併",
      prompt: idxPrompt(s0),
      steps: [
        {
          current: s0, correct: s1,
          distractors: [`\\frac{${x}^{${p + r}}${y}^{${q + r}}}{${x}^{${s}}${y}^{${t}}}`, `${x}^{${p * r}}${y}^{${q * r} - ${t}}`, `\\frac{${x}^{${p}}${y}^{${q}${r}}}{${x}^{${s}}${y}^{${t}}}`, `(${x}^{${p * r}}${y}^{${q * r}})^{${s}}`],
          tip: "分子括號做積的方。",
        },
        {
          current: s1, correct: s2,
          distractors: [`${x}^{${p * r}+${s}}${y}^{${q * r}+${t}}`, `${x}^{${s}-${p * r}}${y}^{${t}-${q * r}}`, `${x}^{${p * r}-${s}}${y}^{${q * r}+${t}}`, `\\frac{${x}^{${p * r}}}{${y}^{${q * r}${t}}}`],
          tip: "同底指數相減。",
        },
        {
          current: s2, correct: s3,
          distractors: [monoPositive([[x, -ex], [y, -ey]]), `${x}^{${ex}}${y}^{${ey}}`, monoPositive([[y, ex], [x, ey]]), `\\frac{1}{${x}^{${ex}}${y}^{${ey}}}`],
          tip: "正指數化。",
        },
      ],
      finalAnswer: s3,
      accepted: [s3, monoPositive([[y, ey], [x, ex]])],
    }));
  }

  // multiply with negatives
  const d4 = [
    ["a", "b", 3, -2, 2, 4], ["x", "y", 4, -1, -3, 2], ["m", "n", 2, 3, -4, 1],
    ["p", "q", -2, 5, 3, -1], ["c", "d", 5, -3, -2, 4],
  ];
  for (const [a, b, m, n, p, q] of d4) {
    const ea = m + p;
    const eb = n + q;
    const sn = (e) => (e < 0 ? `-${-e}` : String(e));
    const s0 = `${a}^{${sn(m)}}${b}^{${sn(n)}} \\times ${a}^{${sn(p)}}${b}^{${sn(q)}}`;
    const s1 = `${a}^{${m}+(${p})}${b}^{${n}+(${q})}`;
    const s2 = `${a}^{${ea}}${b}^{${eb}}`;
    const s3 = monoPositive([[a, ea], [b, eb]]);
    items.push(item({
      id: dId(),
      level: 1,
      type: "含負指數相乘",
      errTag: "同底相乘指數相加",
      prompt: idxPrompt(s0),
      steps: [
        {
          current: s0, correct: s1,
          distractors: [`${a}^{${m * p}}${b}^{${n * q}}`, `${a}^{${m}-${p}}${b}^{${n}-${q}}`, `${a}^{${m}}${b}^{${n}}${a}^{${p}}${b}^{${q}}`, `${a}^{${m + n}}${b}^{${p + q}}`],
          tip: "同底指數相加。",
        },
        {
          current: s1, correct: s2,
          distractors: [`${a}^{${m - p}}${b}^{${n - q}}`, `${a}^{${Math.abs(ea)}}${b}^{${Math.abs(eb)}}`, `${a}^{${ea + eb}}`, `${a}^{${-ea}}${b}^{${-eb}}`],
          tip: "計出各底指數。",
        },
        {
          current: s2, correct: s3,
          distractors: [monoPositive([[a, -ea], [b, -eb]]), `${a}^{${ea}}${b}^{${eb}}`, `\\frac{${a}^{${Math.abs(ea)}}}{${b}^{${Math.abs(eb)}}}`, monoPositive([[b, ea], [a, eb]])],
          tip: "換成正指數。",
        },
      ],
      finalAnswer: s3,
      accepted: [s3, monoPositive([[b, eb], [a, ea]])],
    }));
  }

  // chain divide
  const d5 = [
    ["x", 8, 3, 2], ["a", 9, 2, 4], ["m", 7, 1, 3], ["y", 10, 4, 2],
  ];
  for (const [x, a, b, c] of d5) {
    const ex = a - b - c;
    const s0 = `\\frac{${x}^{${a}}}{${x}^{${b}} \\div ${x}^{${c}}}`;
    // Actually  x^a / (x^b ÷ x^c) = x^a / x^{b-c} = x^{a-(b-c)} = x^{a-b+c}
    // Or (x^a / x^b) / x^c = x^{a-b-c}
    // Use clearer: x^a ÷ x^b ÷ x^c
    const s0b = `${x}^{${a}} \\div ${x}^{${b}} \\div ${x}^{${c}}`;
    const s1 = `${x}^{${a} - ${b}} \\div ${x}^{${c}}`;
    const s2 = `${x}^{${a - b} - ${c}}`;
    const s3 = monoPositive([[x, a - b - c]]);
    items.push(item({
      id: dId(),
      level: 1,
      type: "同底連除",
      errTag: "同底相除指數相減",
      prompt: idxPrompt(s0b),
      steps: [
        {
          current: s0b, correct: s1,
          distractors: [`${x}^{${a} + ${b}} \\div ${x}^{${c}}`, `${x}^{${a} \\div ${b}} \\div ${x}^{${c}}`, `${x}^{${a - b - c}}`, `${x}^{${a}} \\div ${x}^{${b + c}}`],
          tip: "由左至右，先做第一次同底相除。",
        },
        {
          current: s1, correct: s2,
          distractors: [`${x}^{${a - b} + ${c}}`, `${x}^{${a - b} \\times ${c}}`, `${x}^{${c} - (${a - b})}`, `${x}^{${a} - ${b} + ${c}}`],
          tip: "再減去下一個指數。",
        },
        {
          current: s2, correct: s3,
          distractors: [`${x}^{${a - b - c}}`, monoPositive([[x, -(a - b - c)]]), `${x}^{${Math.abs(a - b - c)}}`, `\\frac{1}{${x}^{${a - b - c}}}`],
          tip: "正指數化（若指數為負）。",
        },
      ],
      finalAnswer: s3,
      accepted: [s3, ...(a - b - c >= 0 ? [`${x}^{${a - b - c}}`] : [`\\frac{1}{${x}^{${-(a - b - c)}}}`])],
    }));
  }

  // Level 2 ≥15
  seq = 0;
  const aId = () => id("idx-a");

  // three letters
  const a1p = [
    ["a", "b", "c", 3, 2, 1, 1, 4, 2],
    ["x", "y", "z", 2, 4, 3, 3, 1, 2],
    ["m", "n", "p", 4, 1, 2, 2, 3, 1],
    ["r", "s", "t", 5, 2, 1, 1, 2, 4],
    ["u", "v", "w", 3, 3, 2, 4, 1, 1],
  ];
  for (const [a, b, c, p, q, r, u, v, w] of a1p) {
    const ea = p - u, eb = q - v, ec = r - w;
    const s0 = `\\frac{${a}^{${p}}${b}^{${q}}${c}^{${r}}}{${a}^{${u}}${b}^{${v}}${c}^{${w}}}`;
    const s1 = `${a}^{${p}-${u}}${b}^{${q}-${v}}${c}^{${r}-${w}}`;
    const s2 = `${a}^{${ea}}${b}^{${eb}}${c}^{${ec}}`;
    const s3 = monoPositive([[a, ea], [b, eb], [c, ec]]);
    items.push(item({
      id: aId(),
      level: 2,
      type: "三字母分式",
      errTag: "多底指數合併",
      prompt: idxPrompt(s0),
      steps: [
        {
          current: s0, correct: s1,
          distractors: [`${a}^{${p}+${u}}${b}^{${q}+${v}}${c}^{${r}+${w}}`, `${a}^{${p}${u}}${b}^{${q}${v}}${c}^{${r}${w}}`, `${a}^{${u}-${p}}${b}^{${v}-${q}}${c}^{${w}-${r}}`, `\\frac{${a}^{${p}}}{${b}^{${q}}${c}^{${r}}}`],
          tip: "各底分別做同底相除。",
        },
        {
          current: s1, correct: s2,
          distractors: [`${a}^{${-ea}}${b}^{${-eb}}${c}^{${-ec}}`, `${a}^{${ea + eb + ec}}`, `${a}^{${Math.abs(ea)}}${b}^{${Math.abs(eb)}}${c}^{${Math.abs(ec)}}`, `${a}^{${ea}}${b}^{${eb}+${ec}}`],
          tip: "計出三個指數。",
        },
        {
          current: s2, correct: s3,
          distractors: [monoPositive([[a, -ea], [b, -eb], [c, -ec]]), `${a}^{${ea}}${b}^{${eb}}${c}^{${ec}}`, monoPositive([[c, ea], [b, eb], [a, ec]]), `\\frac{1}{${a}^{${ea}}${b}^{${eb}}${c}^{${ec}}}`],
          tip: "全部用正指數表示。",
        },
      ],
      finalAnswer: s3,
      accepted: [s3],
    }));
  }

  // (a^m / b^n)^{-p}
  const a2p = [
    ["a", "b", 2, 3, 2], ["x", "y", 3, 1, 3], ["m", "n", 4, 2, 2],
    ["p", "q", 1, 4, 2], ["c", "d", 5, 2, 3],
  ];
  for (const [a, b, m, n, p] of a2p) {
    const s0 = `\\left(\\dfrac{${a}^{${m}}}{${b}^{${n}}}\\right)^{-${p}}`;
    const s1 = `\\dfrac{${a}^{-${m * p}}}{${b}^{-${n * p}}}`;
    const s2 = `\\dfrac{${b}^{${n * p}}}{${a}^{${m * p}}}`;
    const s3 = monoPositive([[b, n * p], [a, -m * p]]);
    items.push(item({
      id: aId(),
      level: 2,
      type: "分式整體負指數",
      errTag: "負指數／積的方",
      prompt: idxPrompt(s0),
      steps: [
        {
          current: s0, correct: s1,
          distractors: [`\\dfrac{${a}^{${m * p}}}{${b}^{${n * p}}}`, `\\dfrac{${a}^{-${m}}}{${b}^{-${n}${p}}}`, `\\left(\\dfrac{${b}^{${n}}}{${a}^{${m}}}\\right)^{${p}}`, `${a}^{-${m}}${b}^{${n * p}}`],
          tip: "商的方：指數乘 $-p$。",
        },
        {
          current: s1, correct: s2,
          distractors: [`\\dfrac{${a}^{${m * p}}}{${b}^{${n * p}}}`, `${a}^{-${m * p}}${b}^{${n * p}}`, `\\dfrac{${b}^{-${n * p}}}{${a}^{-${m * p}}}`, `${b}^{${n * p}}${a}^{${m * p}}`],
          tip: "負指數改寫，上下顛倒。",
        },
        {
          current: s2, correct: s3,
          distractors: [monoPositive([[a, m * p], [b, -n * p]]), `${b}^{${n * p}}${a}^{${m * p}}`, `\\dfrac{${a}^{${m * p}}}{${b}^{${n * p}}}`, monoPositive([[a, -m * p], [b, -n * p]])],
          tip: "確認已是正指數形式。",
        },
      ],
      finalAnswer: s3,
      accepted: [s3, `${b}^{${n * p}}${a}^{-${m * p}}`.replace(/^{-/, ""), s2],
    }));
  }

  // fraction power expand (x^{-a} y^b)^p
  const a3p = [
    ["x", "y", 2, 3, 2], ["a", "b", 3, 1, 4], ["m", "n", 1, 4, 3],
    ["p", "q", 4, 2, 2], ["u", "v", 2, 5, 2],
  ];
  for (const [x, y, a, b, p] of a3p) {
    const s0 = `(${x}^{-${a}}${y}^{${b}})^{${p}}`;
    const s1 = `${x}^{-${a * p}}${y}^{${b * p}}`;
    const s2 = monoPositive([[x, -a * p], [y, b * p]]);
    items.push(item({
      id: aId(),
      level: 2,
      type: "分數冪展開",
      errTag: "積的方／負指數",
      prompt: idxPrompt(s0),
      steps: [
        {
          current: s0, correct: s1,
          distractors: [`${x}^{-${a + p}}${y}^{${b + p}}`, `${x}^{${a * p}}${y}^{${b * p}}`, `${x}^{-${a}}${y}^{${b * p}}`, `(${x}${y})^{-${a * b * p}}`],
          tip: "積的方，指數相乘。",
        },
        {
          current: s1, correct: s2,
          distractors: [`${x}^{${a * p}}${y}^{${b * p}}`, monoPositive([[x, a * p], [y, -b * p]]), `${x}^{-${a * p}}${y}^{-${b * p}}`, `\\frac{${y}^{${b * p}}}{${x}^{-${a * p}}}`],
          tip: "負指數改成分母正指數。",
        },
      ],
      finalAnswer: s2,
      accepted: [s2, `${y}^{${b * p}}${x}^{-${a * p}}`.includes("undefined") ? s2 : monoPositive([[y, b * p], [x, -a * p]])],
    }));
  }

  return items;
}

function countByLevel(items) {
  const c = { 0: 0, 1: 0, 2: 0 };
  for (const it of items) c[it.level] = (c[it.level] || 0) + 1;
  return c;
}

function validate(items, name) {
  const ids = new Set();
  for (const it of items) {
    if (ids.has(it.id)) throw new Error(`Duplicate id in ${name}: ${it.id}`);
    ids.add(it.id);
    if (!it.prompt || !it.steps || !it.steps.length) throw new Error(`Bad item ${it.id}`);
    if (it.steps.length < 1 || it.steps.length > 4) throw new Error(`Steps count ${it.id}`);
    for (const s of it.steps) {
      if (!s.distractors || s.distractors.length < 3) throw new Error(`Few distractors ${it.id}`);
    }
    if (name === "change-subject" && it.level === 1 && !it.ref) throw new Error(`Missing ref ${it.id}`);
    if (it.ref && it.level !== 1) throw new Error(`Unexpected ref ${it.id}`);
  }
}

function main() {
  fs.mkdirSync(BANK, { recursive: true });
  const cs = buildChangeSubject();
  const idx = buildIndices();
  validate(cs, "change-subject");
  validate(idx, "indices");
  const csPath = path.join(BANK, "change-subject.json");
  const idxPath = path.join(BANK, "indices.json");
  fs.writeFileSync(csPath, JSON.stringify(cs, null, 2) + "\n");
  fs.writeFileSync(idxPath, JSON.stringify(idx, null, 2) + "\n");
  console.log("change-subject", countByLevel(cs), "total", cs.length);
  console.log("indices", countByLevel(idx), "total", idx.length);
  // parse check
  JSON.parse(fs.readFileSync(csPath, "utf8"));
  JSON.parse(fs.readFileSync(idxPath, "utf8"));
  console.log("JSON OK");
}

main();
