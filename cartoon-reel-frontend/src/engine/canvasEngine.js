/**
 * canvasEngine.js
 * Renders each frame by:
 *  1. Drawing the real background image (cover-fit, with slow Ken Burns pan/zoom)
 *  2. Applying a cinematic color grade overlay per template mood
 *  3. Drawing animated overlay effects (particles, light rays, sparks, etc.)
 *  4. Drawing subtitle pill at the TOP so it never blocks action
 */
import { getImage, TEMPLATE_BG } from './imageLoader';

/* ─── Math helpers ─────────────────────────────────────── */
const lerp  = (a, b, t) => a + (b - a) * t;
const ease  = (t) => -(Math.cos(Math.PI * t) - 1) / 2;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const rand  = (seed, i) => (Math.sin(seed * 127.1 + i * 311.7) * 43758.5453) % 1;

/* ─── Draw background image (cover + Ken Burns) ─────────── */
function drawBg(ctx, W, H, img, t, kenBurns = 'zoom') {
  if (!img) {
    ctx.fillStyle = '#111'; ctx.fillRect(0, 0, W, H); return;
  }
  ctx.save();

  const scale = kenBurns === 'zoom'
    ? 1.04 + ease(t) * 0.06          // slow zoom in
    : 1.08 - ease(t) * 0.06;         // slow zoom out

  const panX = kenBurns === 'pan-r'  ? lerp(0, W * 0.04, ease(t))
             : kenBurns === 'pan-l'  ? lerp(W * 0.04, 0, ease(t)) : 0;

  // cover-fit
  const r  = Math.max(W / img.width, H / img.height) * scale;
  const dw = img.width  * r;
  const dh = img.height * r;
  const dx = (W - dw) / 2 - panX;
  const dy = (H - dh) / 2;

  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

/* ─── Color grade overlay ──────────────────────────────── */
function colorGrade(ctx, W, H, color, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle   = color;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

/* ─── Vignette ─────────────────────────────────────────── */
function vignette(ctx, W, H, strength = 0.55) {
  const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.85);
  g.addColorStop(0, 'transparent');
  g.addColorStop(1, `rgba(0,0,0,${strength})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

/* ─── Cinematic Text System ────────────────────────────────────────── */

/**
 * Smart segmentation: split on sentence boundaries first, then by natural
 * phrase length so no segment is longer than ~6 words.
 */
function segmentText(text) {
  if (!text || !text.trim()) return [];

  // 1. Split on sentence-ending punctuation while keeping the punctuation
  const sentences = text.trim().split(/(?<=[.!?।…])\s+/);
  const segments = [];

  sentences.forEach(sentence => {
    const words = sentence.trim().split(/\s+/);
    // Break long sentences into 5-word natural phrases
    const PHRASE_LEN = 5;
    for (let i = 0; i < words.length; i += PHRASE_LEN) {
      const chunk = words.slice(i, i + PHRASE_LEN).join(' ');
      if (chunk.trim()) segments.push(chunk.trim());
    }
  });

  // Clamp: if too many segments, merge small ones until we have at most 15
  // (at 15s reel, 15 segments = 1s each which is the minimum readable)
  const MAX_SEGS = 12;
  while (segments.length > MAX_SEGS) {
    // Find the shortest pair to merge
    let bestIdx = 0, bestLen = Infinity;
    for (let i = 0; i < segments.length - 1; i++) {
      const merged = segments[i].split(' ').length + segments[i + 1].split(' ').length;
      if (merged < bestLen) { bestLen = merged; bestIdx = i; }
    }
    segments.splice(bestIdx, 2, `${segments[bestIdx]} ${segments[bestIdx + 1]}`);
  }

  return segments;
}

function drawCinematicText(ctx, W, H, text, now) {
  const segments = segmentText(text);
  if (segments.length === 0) return;

  const TOTAL_S = 15;
  const segDur   = TOTAL_S / segments.length;

  let segIdx = Math.floor(now / segDur);
  if (segIdx >= segments.length) segIdx = segments.length - 1;

  const sceneT      = (now % segDur) / segDur; // 0→1 within current segment
  const currentText = segments[segIdx];
  const isLast      = segIdx === segments.length - 1;

  // ── Slide-in fade animation (no box) ────────────────────────────────
  const FADE  = Math.min(0.25, segDur * 0.3);
  let slideY  = 0;
  let alpha   = 1;
  if (sceneT < FADE / segDur) {
    const t = sceneT / (FADE / segDur);
    slideY  = (1 - easeOut(t)) * (H * 0.06);
    alpha   = easeOut(t);
  } else if (sceneT > 1 - FADE / segDur) {
    const t = (sceneT - (1 - FADE / segDur)) / (FADE / segDur);
    alpha   = 1 - t;
    slideY  = t * -(H * 0.03);
  }

  ctx.save();
  ctx.globalAlpha = clamp(alpha, 0, 1);
  ctx.translate(0, slideY);

  // ── Font setup ──────────────────────────────────────────────────────
  const fs = Math.max(22, Math.min(W * 0.065, 40));
  ctx.font = `900 ${fs}px 'Outfit',sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // ── Word-wrap into lines (max 82% canvas width) ──────────────────────
  const maxW = W * 0.82;
  const lh   = fs * 1.5;
  const words = currentText.split(' ');
  const lines = [];
  let cur = '';
  words.forEach(w => {
    const test = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(test).width > maxW) { lines.push(cur); cur = w; }
    else cur = test;
  });
  if (cur) lines.push(cur);

  // ── Text anchored in upper-center of canvas ──────────────────────────
  const textCenterY = H * 0.28;

  // ── Segment counter dots (pagination) ─────────────────────────────────
  if (segments.length > 1) {
    const dotR  = 3;
    const dotGap = dotR * 3.5;
    const totalDotW = segments.length * dotGap - dotGap + dotR * 2;
    let dx = W / 2 - totalDotW / 2 + dotR;
    const dotY = textCenterY - lines.length * lh * 0.5 - dotR * 3.5;
    for (let d = 0; d < segments.length; d++) {
      ctx.beginPath();
      ctx.arc(dx, dotY, dotR, 0, Math.PI * 2);
      ctx.fillStyle = d === segIdx ? (isLast ? '#FFD700' : '#fff') : 'rgba(255,255,255,0.3)';
      ctx.fill();
      dx += dotGap;
    }
  }

  // ── Draw text — cinematic, bare, no box ──────────────────────────────
  const totalTextH = lines.length * lh;
  const textStartY = textCenterY - totalTextH / 2 + lh / 2;

  lines.forEach((l, i) => {
    const y = textStartY + i * lh;

    // Multi-layer shadow for dark backdrop readability
    ctx.save();
    ctx.font = `900 ${fs}px 'Outfit',sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Outer halo
    ctx.shadowColor = 'rgba(0,0,0,0.95)';
    ctx.shadowBlur  = 28;
    ctx.fillStyle   = 'rgba(0,0,0,0.0)'; // transparent to just cast shadow
    ctx.fillText(l, W / 2, y);

    // Actual text
    ctx.shadowColor = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur  = 12;
    if (isLast) {
      // Last segment: golden gradient text
      const grd = ctx.createLinearGradient(0, y - fs, 0, y + fs);
      grd.addColorStop(0, '#FFE066');
      grd.addColorStop(0.5, '#FFD700');
      grd.addColorStop(1, '#FFA500');
      ctx.fillStyle = grd;
    } else {
      ctx.fillStyle = '#ffffff';
    }
    ctx.fillText(l, W / 2, y);

    // Stroke outline for crisp readability
    ctx.lineWidth   = fs * 0.08;
    ctx.strokeStyle = isLast ? 'rgba(120,60,0,0.7)' : 'rgba(0,0,0,0.7)';
    ctx.shadowBlur  = 0;
    ctx.strokeText(l, W / 2, y);

    ctx.restore();
  });

  ctx.restore();
}

function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

// Backward compatibility stub
export function subtitle() {}


function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/* ═══════════════════ SECTIONS TEXT SYSTEM ══════════════════
 * Three-zone cinematic text:
 *   Title      → top bar, highlighted, full duration
 *   Content    → center, segmented story, 1s–12s
 *   Conclusion → bottom, slides in at 11s
 * ═══════════════════════════════════════════════════════════ */

/** Convert #rrggbb to rgba() string */
function hexToRgba(hex, alpha) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!r) return `rgba(255,255,255,${alpha})`;
  return `rgba(${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)},${alpha})`;
}

/** Build canvas font string from theme + size + language */
function getFontStr(theme, size, lang) {
  const langStack = lang === 'ta'
    ? "'Noto Sans Tamil', Latha, "
    : lang === 'hi'
      ? "'Noto Sans Devanagari', Mangal, "
      : '';
  switch (theme) {
    case 'bold':    return `900 ${size}px ${langStack}'Outfit', sans-serif`;
    case 'elegant': return `italic 600 ${size}px ${langStack}Georgia, serif`;
    case 'classic': return `600 ${size}px ${langStack}Georgia, serif`;
    default:        return `700 ${size}px ${langStack}'Outfit', sans-serif`;
  }
}

/** Word-wrap text into lines that fit maxWidth */
function wrapTextLines(ctx, text, maxWidth) {
  if (!text) return [];
  const words = text.trim().split(/\s+/);
  const lines = [];
  let cur = '';
  words.forEach(w => {
    const test = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth) { if (cur) lines.push(cur); cur = w; }
    else cur = test;
  });
  if (cur) lines.push(cur);
  return lines;
}

/** X anchor from alignment */
function getAlignX(align, W) {
  if (align === 'left')  return W * 0.07;
  if (align === 'right') return W * 0.93;
  return W / 2;
}

/* ── Title Section (top, entire video) ─────────────────── */
function drawTitleSection(ctx, W, H, sec, now, lang) {
  const txt = (sec?.text || '').trim();
  if (!txt) return;

  const color   = sec.color || '#FFD700';
  const align   = sec.align || 'center';
  const font    = sec.font  || 'bold';

  // Slide-in from top
  let alpha = 1, slideY = 0;
  if (now < 0.65) {
    const t = now / 0.65;
    alpha  = easeOut(t);
    slideY = (1 - easeOut(t)) * (-H * 0.045);
  }

  const fs      = Math.max(20, Math.min(W * 0.062, 38));
  const lh      = fs * 1.38;
  const maxW    = W * 0.86;
  const anchorY = H * 0.11;

  ctx.save();
  ctx.globalAlpha = clamp(alpha, 0, 1);
  ctx.translate(0, slideY);
  ctx.font = getFontStr(font, fs, lang);
  ctx.textAlign    = align;
  ctx.textBaseline = 'middle';
  const textX  = getAlignX(align, W);
  const lines  = wrapTextLines(ctx, txt, maxW);
  const totalH = lines.length * lh;
  const padX   = W * 0.05;
  const padY   = fs * 0.38;
  const boxTop = anchorY - totalH / 2 - padY;
  const boxH   = totalH + padY * 2;

  // Highlight panel
  rr(ctx, padX, boxTop, W - padX * 2, boxH, 10);
  ctx.fillStyle = hexToRgba(color, 0.13);
  ctx.fill();

  // Left accent bar
  ctx.fillStyle   = color;
  ctx.shadowColor = color;
  ctx.shadowBlur  = 14;
  ctx.fillRect(padX, boxTop, 4, boxH);
  ctx.shadowBlur = 0;

  // Text
  lines.forEach((line, i) => {
    const y = anchorY - totalH / 2 + lh / 2 + i * lh;
    ctx.shadowColor = 'rgba(0,0,0,0.95)';
    ctx.shadowBlur  = 16;
    ctx.fillStyle   = color;
    ctx.fillText(line, textX, y);
    ctx.shadowBlur  = 0;
    ctx.lineWidth   = Math.max(1, fs * 0.065);
    ctx.strokeStyle = 'rgba(0,0,0,0.7)';
    ctx.strokeText(line, textX, y);
  });
  ctx.restore();
}

/* ── Content Section (center, segmented 1s–12s) ─────────── */
function drawContentSection(ctx, W, H, sec, now, lang) {
  const txt = (sec?.text || '').trim();
  if (!txt) return;

  const START = 0.8, END = 12;
  if (now < START || now >= END) return;

  const color = sec.color || '#FFFFFF';
  const align = sec.align || 'center';
  const font  = sec.font  || 'modern';

  const relNow  = now - START;
  const relDur  = END - START;
  const segs    = segmentText(txt);
  if (!segs.length) return;

  const segDur  = relDur / segs.length;
  let segIdx    = Math.floor(relNow / segDur);
  if (segIdx >= segs.length) segIdx = segs.length - 1;
  const sceneT  = (relNow % segDur) / segDur;

  // Fade in/out
  const FADE  = 0.25;
  let alpha   = 1, slideY = 0;
  if (sceneT < FADE) {
    const t = sceneT / FADE;
    alpha  = easeOut(t); slideY = (1 - easeOut(t)) * (H * 0.035);
  } else if (sceneT > 1 - FADE) {
    const t = (sceneT - (1 - FADE)) / FADE;
    alpha  = 1 - t; slideY = -t * (H * 0.02);
  }

  const fs      = Math.max(20, Math.min(W * 0.058, 36));
  const lh      = fs * 1.52;
  const maxW    = W * 0.84;
  const anchorY = H * 0.47;

  ctx.save();
  ctx.globalAlpha = clamp(alpha, 0, 1);
  ctx.translate(0, slideY);
  ctx.font = getFontStr(font, fs, lang);
  ctx.textAlign    = align;
  ctx.textBaseline = 'middle';
  const textX  = getAlignX(align, W);
  const lines  = wrapTextLines(ctx, segs[segIdx], maxW);
  const totalH = lines.length * lh;

  // Pagination dots
  if (segs.length > 1) {
    const dotR = 3, dotGap = dotR * 3.5;
    const dotTotalW = segs.length * dotGap - dotGap + dotR * 2;
    let dx = W / 2 - dotTotalW / 2 + dotR;
    const dotY = anchorY - totalH / 2 - dotR * 4;
    for (let d = 0; d < segs.length; d++) {
      ctx.beginPath();
      ctx.arc(dx, dotY, dotR, 0, Math.PI * 2);
      ctx.fillStyle = d === segIdx ? hexToRgba(color, 0.9) : 'rgba(255,255,255,0.22)';
      ctx.fill();
      dx += dotGap;
    }
  }

  // Text
  lines.forEach((line, i) => {
    const y = anchorY - totalH / 2 + lh / 2 + i * lh;
    ctx.shadowColor = 'rgba(0,0,0,0.95)';
    ctx.shadowBlur  = 18;
    ctx.fillStyle   = color;
    ctx.fillText(line, textX, y);
    ctx.shadowBlur  = 0;
    ctx.lineWidth   = Math.max(1, fs * 0.07);
    ctx.strokeStyle = 'rgba(0,0,0,0.7)';
    ctx.strokeText(line, textX, y);
  });
  ctx.restore();
}

/* ── Conclusion Section (bottom, slides in at 11s) ─────── */
function drawConclusionSection(ctx, W, H, sec, now, lang) {
  const txt = (sec?.text || '').trim();
  if (!txt || now < 11) return;

  const color   = sec.color || '#C084FC';
  const align   = sec.align || 'center';
  const font    = sec.font  || 'bold';

  // Slide-in from bottom
  const t      = clamp((now - 11) / 0.9, 0, 1);
  const alpha  = easeOut(t);
  const slideY = (1 - easeOut(t)) * (H * 0.05);

  const fs      = Math.max(18, Math.min(W * 0.056, 34));
  const lh      = fs * 1.45;
  const maxW    = W * 0.86;
  const anchorY = H * 0.80;

  ctx.save();
  ctx.globalAlpha = clamp(alpha, 0, 1);
  ctx.translate(0, slideY);
  ctx.font = getFontStr(font, fs, lang);
  ctx.textAlign    = align;
  ctx.textBaseline = 'middle';
  const textX  = getAlignX(align, W);
  const lines  = wrapTextLines(ctx, txt, maxW);
  const totalH = lines.length * lh;
  const padX   = W * 0.05;
  const padY   = fs * 0.4;
  const boxTop = anchorY - totalH / 2 - padY;
  const boxH   = totalH + padY * 2;

  // Gradient background
  const grd = ctx.createLinearGradient(padX, boxTop, W - padX, boxTop + boxH);
  grd.addColorStop(0, hexToRgba(color, 0.2));
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  rr(ctx, padX, boxTop, W - padX * 2, boxH, 10);
  ctx.fillStyle = grd;
  ctx.fill();

  // Bottom accent bar
  ctx.fillStyle   = color;
  ctx.shadowColor = color;
  ctx.shadowBlur  = 12;
  ctx.fillRect(padX, boxTop + boxH - 4, W - padX * 2, 4);
  ctx.shadowBlur = 0;

  // Text with white→color gradient fill
  lines.forEach((line, i) => {
    const y = anchorY - totalH / 2 + lh / 2 + i * lh;
    const tg = ctx.createLinearGradient(textX - 80, y - fs * 0.5, textX + 80, y + fs * 0.5);
    tg.addColorStop(0, '#fff');
    tg.addColorStop(0.5, color);
    tg.addColorStop(1, '#fff');
    ctx.shadowColor = 'rgba(0,0,0,0.95)';
    ctx.shadowBlur  = 14;
    ctx.fillStyle   = tg;
    ctx.fillText(line, textX, y);
    ctx.shadowBlur  = 0;
    ctx.lineWidth   = Math.max(1, fs * 0.065);
    ctx.strokeStyle = 'rgba(0,0,0,0.65)';
    ctx.strokeText(line, textX, y);
  });
  ctx.restore();
}

/* ── Dispatcher ─────────────────────────────────────────── */
function drawSections(ctx, W, H, sections, now, lang) {
  if (sections.title)      drawTitleSection    (ctx, W, H, sections.title,      now, lang || 'en');
  if (sections.content)    drawContentSection  (ctx, W, H, sections.content,    now, lang || 'en');
  if (sections.conclusion) drawConclusionSection(ctx, W, H, sections.conclusion, now, lang || 'en');
}

/* ─── Reusable overlay effects ─────────────────────────── */

function lightRays(ctx, W, H, t, color = 'rgba(255,255,200,0.07)', count = 6) {
  ctx.save();
  for (let i = 0; i < count; i++) {
    const ang   = (i / count) * Math.PI - Math.PI / 2 + Math.sin(t * 0.5 + i) * 0.2;
    const alpha = 0.04 + Math.sin(t * 2 + i * 1.3) * 0.02;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle   = color;
    ctx.beginPath();
    ctx.moveTo(W / 2, 0);
    ctx.lineTo(W / 2 + Math.cos(ang - 0.08) * H * 1.5, H);
    ctx.lineTo(W / 2 + Math.cos(ang + 0.08) * H * 1.5, H);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

function sparkles(ctx, W, H, t, color = '#FFD700', count = 14, area = [0, 0, 1, 1]) {
  ctx.save();
  for (let i = 0; i < count; i++) {
    const x = (area[0] + Math.abs(rand(t * 0.1, i * 3)) * (area[2] - area[0])) * W;
    const y = (area[1] + Math.abs(rand(t * 0.1, i * 5 + 1)) * (area[3] - area[1])) * H;
    const alpha = clamp(Math.sin(t * 4 + i * 0.9), 0, 1);
    const size  = 2 + Math.abs(rand(t, i * 7)) * 4;
    ctx.globalAlpha = alpha * 0.7;
    ctx.fillStyle   = color;
    ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function particles(ctx, W, H, t, {
  count = 20, color = '#fff', minR = 2, maxR = 6,
  speedY = -0.3, drift = 0.02, startY = 1,
} = {}) {
  ctx.save();
  for (let i = 0; i < count; i++) {
    const phase = (t * speedY * -1 + rand(0, i)) % 1;
    const x = (rand(1, i * 2) * 0.9 + 0.05) * W + Math.sin(t + i) * drift * W;
    const y = ((1 - phase) % 1) * H;
    const r = minR + Math.abs(rand(2, i)) * (maxR - minR);
    ctx.globalAlpha = clamp(phase < 0.1 ? phase * 10 : phase > 0.9 ? (1 - phase) * 10 : 0.7, 0, 0.8);
    ctx.fillStyle   = color;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function energyRing(ctx, W, H, t, cx, cy, baseR, color) {
  const r = baseR + Math.sin(t * 8) * 8;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth   = 3;
  ctx.globalAlpha = 0.55 + Math.sin(t * 6) * 0.2;
  ctx.shadowColor = color; ctx.shadowBlur = 18;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}

function flash(ctx, W, H, t, alpha = 0.18) {
  if (Math.sin(t * 18) > 0.72) {
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.fillRect(0, 0, W, H);
  }
}

function screenShake(ctx, W, H, t, intensity = 4) {
  const sx = Math.sin(t * 30) * intensity * (0.5 - Math.abs((t % 1) - 0.5));
  const sy = Math.cos(t * 27) * intensity * 0.4 * (0.5 - Math.abs((t % 1) - 0.5));
  ctx.translate(sx, sy);
}

/* ═══════════════════ SCENE RENDERERS ══════════════════════
 * Each receives (ctx, W, H, sceneT 0-1, template, now, text)
 * Background image is already drawn before calling scene.
 * ═════════════════════════════════════════════════════════ */
const SCENES = {

  /* ── SHINCHAN ─────────────────────────────────────────── */
  shin_run(ctx, W, H, t, tpl, now, text) {
    lightRays(ctx, W, H, now, 'rgba(255,240,180,0.06)', 8);
    sparkles(ctx, W, H, now, '#FFD700', 10, [0, 0.1, 1, 0.5]);
    // animated running shadow on ground
    const kx   = W * (0.1 + ease(t) * 0.75);
    const shade = ctx.createEllipse ? null : null;
    ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.globalAlpha = 0.4;
    ctx.beginPath(); ctx.ellipse(kx, H * 0.84, 22, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // speed lines
    ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(kx - 55 - i * 18, H * 0.65 - 20 + i * 10);
      ctx.lineTo(kx - 90 - i * 18, H * 0.65 - 20 + i * 10); ctx.stroke();
    }
    ctx.restore();
    vignette(ctx, W, H, 0.4);
    
  },

  shin_dance(ctx, W, H, t, tpl, now, text) {
    colorGrade(ctx, W, H, 'rgba(255,200,100,0.12)', 1);
    lightRays(ctx, W, H, now, 'rgba(255,200,80,0.08)', 10);
    // disco-like color pulses
    const hue = (now * 40) % 360;
    colorGrade(ctx, W, H, `hsla(${hue},80%,60%,0.06)`, 1);
    sparkles(ctx, W, H, now, '#fff', 20, [0.1, 0.1, 0.9, 0.9]);
    vignette(ctx, W, H, 0.35);
    
  },

  shin_silly(ctx, W, H, t, tpl, now, text) {
    const hue2 = (now * 60) % 360;
    colorGrade(ctx, W, H, `hsla(${hue2},70%,55%,0.09)`, 1);
    sparkles(ctx, W, H, now, '#FF6B6B', 16, [0, 0, 1, 1]);
    // spinning stars
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + now * 2;
      ctx.save(); ctx.globalAlpha = 0.55;
      ctx.fillStyle = ['#FFD700','#FF6B6B','#00E5FF'][i % 3];
      ctx.beginPath();
      ctx.arc(W/2 + Math.cos(a)*80, H/2 + Math.sin(a)*50, 8, 0, Math.PI*2); ctx.fill();
      ctx.restore();
    }
    vignette(ctx, W, H, 0.3);
    
  },

  shin_happy(ctx, W, H, t, tpl, now, text) {
    lightRays(ctx, W, H, now, 'rgba(255,230,100,0.07)', 12);
    particles(ctx, W, H, now, { count:22, color:'#FFD700', minR:3, maxR:7, speedY:0.25 });
    particles(ctx, W, H, now + 0.5, { count:14, color:'#FF6BB5', minR:2, maxR:5, speedY:0.2 });
    vignette(ctx, W, H, 0.35);
    
  },

  /* ── CHOTA BHEEM ──────────────────────────────────────── */
  bheem_power(ctx, W, H, t, tpl, now, text) {
    const pulse = 1 + Math.sin(now * 8) * 0.04;
    colorGrade(ctx, W, H, 'rgba(255,193,7,0.1)', pulse);
    lightRays(ctx, W, H, now, 'rgba(255,200,0,0.08)', 10);
    energyRing(ctx, W, H, now, W/2, H*0.52, 90, '#FFC107');
    energyRing(ctx, W, H, now + 0.3, W/2, H*0.52, 130, 'rgba(255,193,7,0.4)');
    sparkles(ctx, W, H, now, '#FFD700', 18, [0.1, 0.3, 0.9, 0.8]);
    vignette(ctx, W, H, 0.5);
    
  },

  bheem_friends(ctx, W, H, t, tpl, now, text) {
    colorGrade(ctx, W, H, 'rgba(100,200,255,0.08)', 1);
    lightRays(ctx, W, H, now, 'rgba(150,220,255,0.06)', 8);
    sparkles(ctx, W, H, now, '#87CEEB', 12, [0, 0, 1, 0.6]);
    particles(ctx, W, H, now, { count:10, color:'#FFD700', minR:2, maxR:5, speedY:0.15 });
    vignette(ctx, W, H, 0.4);
    
  },

  bheem_laddoo(ctx, W, H, t, tpl, now, text) {
    const glow = ctx.createRadialGradient(W*0.5, H*0.45, 0, W*0.5, H*0.45, 160);
    glow.addColorStop(0, 'rgba(255,193,7,0.35)');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
    sparkles(ctx, W, H, now, '#FFA000', 20, [0.1, 0.2, 0.9, 0.7]);
    lightRays(ctx, W, H, now, 'rgba(255,180,0,0.07)', 8);
    vignette(ctx, W, H, 0.45);
    
  },

  bheem_victory(ctx, W, H, t, tpl, now, text) {
    lightRays(ctx, W, H, now, 'rgba(255,220,80,0.09)', 14);
    particles(ctx, W, H, now, { count:28, color:'#FFC107', minR:3, maxR:8, speedY:0.22 });
    particles(ctx, W, H, now + 0.4, { count:20, color:'#FF5722', minR:2, maxR:6, speedY:0.19 });
    flash(ctx, W, H, now * 0.3, 0.1);
    vignette(ctx, W, H, 0.4);
    
  },

  /* ── BEN 10 ───────────────────────────────────────────── */
  ben_omnitrix(ctx, W, H, t, tpl, now, text) {
    colorGrade(ctx, W, H, 'rgba(0,80,0,0.18)', 1);
    // green scan lines
    ctx.save();
    for (let y = 0; y < H; y += 8) {
      ctx.fillStyle = 'rgba(0,255,65,0.025)';
      ctx.fillRect(0, y, W, 2);
    }
    ctx.restore();
    energyRing(ctx, W, H, now, W/2, H*0.45, 70, '#00FF41');
    energyRing(ctx, W, H, now + 0.5, W/2, H*0.45, 110, 'rgba(0,200,50,0.4)');
    sparkles(ctx, W, H, now, '#00FF41', 16, [0, 0.1, 1, 0.85]);
    flash(ctx, W, H, now, 0.12);
    vignette(ctx, W, H, 0.6);
    
  },

  ben_transform(ctx, W, H, t, tpl, now, text) {
    const hue3 = (now * 50) % 360;
    colorGrade(ctx, W, H, `hsla(${hue3},100%,40%,0.12)`, 1);
    colorGrade(ctx, W, H, 'rgba(0,30,0,0.2)', 1);
    flash(ctx, W, H, now, 0.22);
    energyRing(ctx, W, H, now, W/2, H/2, 65 + Math.sin(now*10)*12, '#00FF41');
    sparkles(ctx, W, H, now, '#00FFAA', 22, [0.05, 0.1, 0.95, 0.9]);
    vignette(ctx, W, H, 0.55);
    
  },

  ben_battle(ctx, W, H, t, tpl, now, text) {
    colorGrade(ctx, W, H, 'rgba(0,20,0,0.22)', 1);
    ctx.save(); screenShake(ctx, W, H, now, 5);
    // laser beam
    ctx.save();
    ctx.strokeStyle = '#00FF41'; ctx.lineWidth = 5;
    ctx.shadowColor = '#00FF41'; ctx.shadowBlur  = 20;
    ctx.globalAlpha = 0.8;
    ctx.beginPath(); ctx.moveTo(W*0.25, H*0.48); ctx.lineTo(W*0.75, H*0.48); ctx.stroke();
    ctx.restore();
    sparkles(ctx, W, H, now, '#FF5722', 12, [0.3, 0.3, 0.7, 0.7]);
    flash(ctx, W, H, now * 1.5, 0.18);
    ctx.restore();
    vignette(ctx, W, H, 0.6);
    
  },

  ben_hero(ctx, W, H, t, tpl, now, text) {
    colorGrade(ctx, W, H, 'rgba(0,10,30,0.25)', 1);
    lightRays(ctx, W, H, now, 'rgba(0,255,100,0.06)', 10);
    particles(ctx, W, H, now, { count:20, color:'#00FF41', minR:1, maxR:4, speedY:0.2, startY:0.8 });
    energyRing(ctx, W, H, now, W/2, H*0.4, 100, 'rgba(0,200,80,0.3)');
    vignette(ctx, W, H, 0.55);
    
  },

  /* ── JACKIE CHAN ──────────────────────────────────────── */
  jackie_kick(ctx, W, H, t, tpl, now, text) {
    colorGrade(ctx, W, H, 'rgba(100,0,0,0.15)', 1);
    ctx.save(); screenShake(ctx, W, H, now, 3);
    sparkles(ctx, W, H, now, '#FF6F00', 14, [0.2, 0.2, 0.8, 0.8]);
    flash(ctx, W, H, now, 0.15);
    ctx.restore();
    lightRays(ctx, W, H, now, 'rgba(255,100,0,0.06)', 6);
    vignette(ctx, W, H, 0.55);
    
  },

  jackie_dodge(ctx, W, H, t, tpl, now, text) {
    colorGrade(ctx, W, H, 'rgba(80,0,0,0.1)', 1);
    // motion blur streaks
    ctx.save(); ctx.strokeStyle = 'rgba(255,200,100,0.3)'; ctx.lineWidth = 3;
    for (let i = 0; i < 6; i++) {
      const ly = H * (0.35 + i * 0.05);
      ctx.beginPath(); ctx.moveTo(0, ly); ctx.lineTo(W * (0.3 + Math.sin(now + i) * 0.1), ly); ctx.stroke();
    }
    ctx.restore();
    sparkles(ctx, W, H, now, '#FFB300', 10, [0, 0.3, 1, 0.8]);
    vignette(ctx, W, H, 0.5);
    
  },

  jackie_combo(ctx, W, H, t, tpl, now, text) {
    colorGrade(ctx, W, H, 'rgba(120,10,0,0.2)', 1);
    ctx.save(); screenShake(ctx, W, H, now, 6);
    flash(ctx, W, H, now * 2, 0.2);
    sparkles(ctx, W, H, now, '#FF3D00', 18, [0.2, 0.2, 0.8, 0.8]);
    energyRing(ctx, W, H, now, W/2, H*0.48, 60, 'rgba(255,100,0,0.6)');
    ctx.restore();
    vignette(ctx, W, H, 0.55);
    
  },

  jackie_win(ctx, W, H, t, tpl, now, text) {
    lightRays(ctx, W, H, now, 'rgba(255,180,50,0.08)', 14);
    particles(ctx, W, H, now, { count:26, color:'#FF6F00', minR:3, maxR:8, speedY:0.2 });
    particles(ctx, W, H, now + 0.3, { count:18, color:'#FFD700', minR:2, maxR:5, speedY:0.18 });
    colorGrade(ctx, W, H, 'rgba(80,20,0,0.1)', 1);
    vignette(ctx, W, H, 0.4);
    
  },

  /* ── GRASS ────────────────────────────────────────────── */
  grass_sway(ctx, W, H, t, tpl, now, text) {
    colorGrade(ctx, W, H, 'rgba(255,250,200,0.08)', 1);
    lightRays(ctx, W, H, now, 'rgba(255,255,180,0.06)', 8);
    sparkles(ctx, W, H, now, '#FFEB3B', 10, [0, 0.1, 1, 0.5]);
    vignette(ctx, W, H, 0.35);
    
  },

  grass_butterfly(ctx, W, H, t, tpl, now, text) {
    colorGrade(ctx, W, H, 'rgba(200,240,255,0.08)', 1);
    sparkles(ctx, W, H, now, '#E1F5FE', 14, [0, 0, 1, 0.7]);
    particles(ctx, W, H, now, { count:8, color:'#fff', minR:2, maxR:5, speedY:0.1 });
    vignette(ctx, W, H, 0.3);
    
  },

  grass_breeze(ctx, W, H, t, tpl, now, text) {
    colorGrade(ctx, W, H, 'rgba(200,255,220,0.08)', 1);
    // horizontal wind lines
    ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1.5;
    for (let i = 0; i < 7; i++) {
      const off = ((now * 0.3 + i * 0.14) % 1) * W;
      ctx.beginPath(); ctx.moveTo(off - W * 0.3, H * (0.3 + i * 0.07));
      ctx.bezierCurveTo(off, H * (0.28 + i * 0.07), off + W * 0.1, H * (0.32 + i * 0.07), off + W * 0.3, H * (0.3 + i * 0.07));
      ctx.stroke();
    }
    ctx.restore();
    vignette(ctx, W, H, 0.3);
    
  },

  grass_sunset(ctx, W, H, t, tpl, now, text) {
    colorGrade(ctx, W, H, 'rgba(255,120,50,0.18)', 1);
    lightRays(ctx, W, H, now, 'rgba(255,160,50,0.07)', 12);
    vignette(ctx, W, H, 0.5);
    
  },

  /* ── FOREST ───────────────────────────────────────────── */
  forest_canopy(ctx, W, H, t, tpl, now, text) {
    lightRays(ctx, W, H, now, 'rgba(200,255,200,0.07)', 8);
    colorGrade(ctx, W, H, 'rgba(0,40,0,0.15)', 1);
    sparkles(ctx, W, H, now, '#A5D6A7', 8, [0.1, 0.1, 0.9, 0.6]);
    vignette(ctx, W, H, 0.5);
    
  },

  forest_water(ctx, W, H, t, tpl, now, text) {
    colorGrade(ctx, W, H, 'rgba(0,30,50,0.2)', 1);
    sparkles(ctx, W, H, now, '#B2EBF2', 12, [0.2, 0.5, 0.8, 1]);
    particles(ctx, W, H, now, { count:10, color:'rgba(178,235,242,0.6)', minR:1, maxR:3, speedY:0.12 });
    vignette(ctx, W, H, 0.5);
    
  },

  forest_birds(ctx, W, H, t, tpl, now, text) {
    colorGrade(ctx, W, H, 'rgba(0,10,40,0.22)', 1);
    sparkles(ctx, W, H, now, '#E3F2FD', 10, [0, 0, 1, 0.5]);
    vignette(ctx, W, H, 0.55);
    
  },

  forest_mist(ctx, W, H, t, tpl, now, text) {
    colorGrade(ctx, W, H, 'rgba(20,40,20,0.25)', 1);
    // mist layers
    [0.35, 0.5, 0.62].forEach((my, i) => {
      const mg = ctx.createLinearGradient(0, H * my, 0, H * (my + 0.12));
      mg.addColorStop(0, 'transparent');
      mg.addColorStop(0.5, `rgba(220,240,220,${0.12 - i * 0.03})`);
      mg.addColorStop(1, 'transparent');
      ctx.save(); ctx.translate(Math.sin(now + i) * 15, 0);
      ctx.fillStyle = mg; ctx.fillRect(0, H * my, W, H * 0.12);
      ctx.restore();
    });
    vignette(ctx, W, H, 0.6);
    
  },

  /* ── TURMERIC ─────────────────────────────────────────── */
  turmeric_field(ctx, W, H, t, tpl, now, text) {
    colorGrade(ctx, W, H, 'rgba(255,193,7,0.1)', 1);
    lightRays(ctx, W, H, now, 'rgba(255,200,50,0.07)', 8);
    sparkles(ctx, W, H, now, '#FFC107', 12, [0, 0.3, 1, 1]);
    vignette(ctx, W, H, 0.4);
    
  },

  turmeric_harvest(ctx, W, H, t, tpl, now, text) {
    colorGrade(ctx, W, H, 'rgba(255,150,0,0.12)', 1);
    particles(ctx, W, H, now, { count:14, color:'#FFC107', minR:2, maxR:6, speedY:0.2 });
    lightRays(ctx, W, H, now, 'rgba(255,180,0,0.07)', 8);
    vignette(ctx, W, H, 0.45);
    
  },

  turmeric_glow(ctx, W, H, t, tpl, now, text) {
    const pulse2 = 0.25 + Math.sin(now * 4) * 0.08;
    colorGrade(ctx, W, H, `rgba(255,200,0,${pulse2})`, 1);
    lightRays(ctx, W, H, now, 'rgba(255,230,50,0.09)', 12);
    sparkles(ctx, W, H, now, '#FFE082', 20, [0, 0, 1, 1]);
    vignette(ctx, W, H, 0.45);
    
  },

  turmeric_dusk(ctx, W, H, t, tpl, now, text) {
    colorGrade(ctx, W, H, 'rgba(180,70,0,0.2)', 1);
    lightRays(ctx, W, H, now, 'rgba(255,120,50,0.07)', 8);
    vignette(ctx, W, H, 0.55);
    
  },

  /* ── CHILLI ───────────────────────────────────────────── */
  chilli_garden(ctx, W, H, t, tpl, now, text) {
    colorGrade(ctx, W, H, 'rgba(180,0,0,0.1)', 1);
    sparkles(ctx, W, H, now, '#FF5252', 14, [0, 0.3, 1, 1]);
    lightRays(ctx, W, H, now, 'rgba(255,50,50,0.06)', 6);
    vignette(ctx, W, H, 0.45);
    
  },

  chilli_glow(ctx, W, H, t, tpl, now, text) {
    const rp = 0.2 + Math.sin(now * 5) * 0.07;
    colorGrade(ctx, W, H, `rgba(220,0,0,${rp})`, 1);
    energyRing(ctx, W, H, now, W/2, H*0.48, 80, 'rgba(255,82,82,0.6)');
    sparkles(ctx, W, H, now, '#FF1744', 18, [0.1, 0.2, 0.9, 0.85]);
    vignette(ctx, W, H, 0.5);
    
  },

  chilli_rain(ctx, W, H, t, tpl, now, text) {
    colorGrade(ctx, W, H, 'rgba(150,0,0,0.15)', 1);
    ctx.save(); screenShake(ctx, W, H, now * 0.5, 2);
    particles(ctx, W, H, now, { count:20, color:'#FF5252', minR:2, maxR:5, speedY:0.35, drift:0.01 });
    ctx.restore();
    vignette(ctx, W, H, 0.45);
    
  },

  chilli_harvest(ctx, W, H, t, tpl, now, text) {
    colorGrade(ctx, W, H, 'rgba(120,0,0,0.1)', 1);
    sparkles(ctx, W, H, now, '#FF8A65', 12, [0, 0.4, 1, 1]);
    lightRays(ctx, W, H, now, 'rgba(255,80,50,0.06)', 8);
    vignette(ctx, W, H, 0.4);
    
  },

  /* ── SAMBAR ───────────────────────────────────────────── */
  sambar_cook(ctx, W, H, t, tpl, now, text) {
    colorGrade(ctx, W, H, 'rgba(80,20,0,0.18)', 1);
    // steam particles rising
    particles(ctx, W, H, now, { count:16, color:'rgba(255,220,180,0.5)', minR:4, maxR:10, speedY:0.2, drift:0.03, startY:0.65 });
    lightRays(ctx, W, H, now, 'rgba(255,150,50,0.06)', 6);
    vignette(ctx, W, H, 0.55);
    
  },

  sambar_spice(ctx, W, H, t, tpl, now, text) {
    colorGrade(ctx, W, H, 'rgba(80,10,80,0.15)', 1);
    sparkles(ctx, W, H, now, '#FF7043', 16, [0, 0.2, 1, 0.9]);
    particles(ctx, W, H, now, { count:10, color:'#FFA726', minR:2, maxR:5, speedY:0.18 });
    vignette(ctx, W, H, 0.5);
    
  },

  sambar_steam(ctx, W, H, t, tpl, now, text) {
    colorGrade(ctx, W, H, 'rgba(50,0,80,0.2)', 1);
    particles(ctx, W, H, now, { count:22, color:'rgba(255,200,160,0.45)', minR:5, maxR:14, speedY:0.18, drift:0.025, startY:0.7 });
    lightRays(ctx, W, H, now, 'rgba(255,160,100,0.06)', 8);
    vignette(ctx, W, H, 0.5);
    
  },

  sambar_feast(ctx, W, H, t, tpl, now, text) {
    colorGrade(ctx, W, H, 'rgba(60,0,80,0.15)', 1);
    lightRays(ctx, W, H, now, 'rgba(255,180,100,0.07)', 10);
    particles(ctx, W, H, now, { count:18, color:'#FFCCBC', minR:2, maxR:6, speedY:0.2 });
    vignette(ctx, W, H, 0.45);
    
  },
};

/* ═══════════════════ PUBLIC API ════════════════════════════ */

const KB_MODE = ['zoom', 'zoom-out', 'pan-r', 'pan-l'];

// Cache maps for dynamic user blobs so canvas doesn't stutter building DOM images
const kb_custom_bg_cache = {};
const custom_sprite_cache = {};
const custom_media_cache  = {}; // { key: HTMLImageElement | HTMLVideoElement }

/* ── Hand gesture pointing animation ── */
function drawHandGesture(ctx, W, H, now, animationEnabled) {
  if (!animationEnabled) return;

  // Gentle hover bob
  const bob = Math.sin(now * Math.PI * 2.5) * (H * 0.008);
  // Pointing arm oscillation — tip moves toward text area (upper-center)
  const pointSwing = Math.sin(now * Math.PI * 1.8) * 0.12;
  // Finger wag for emphasis
  const fingerWag  = Math.sin(now * Math.PI * 5) * 0.08;

  // Anchor: bottom-right quadrant of canvas
  const anchorX = W * 0.72;
  const anchorY = H * 0.78 + bob;

  // Arm length
  const armLen = H * 0.22;

  // Pointing direction: upper-left toward text area (≈ 30% height)
  const baseAngle = -Math.PI * 0.55; // roughly upper-left
  const angle     = baseAngle + pointSwing;

  const elbowX = anchorX + Math.cos(angle + 0.4) * armLen * 0.48;
  const elbowY = anchorY + Math.sin(angle + 0.4) * armLen * 0.48;
  const handX  = anchorX + Math.cos(angle) * armLen;
  const handY  = anchorY + Math.sin(angle) * armLen;

  ctx.save();

  // ── Arm (upper + lower) ──────────────────────────────────────────────
  ctx.lineCap    = 'round';
  ctx.lineJoin   = 'round';

  // Upper arm
  ctx.beginPath();
  ctx.moveTo(anchorX, anchorY);
  ctx.lineTo(elbowX, elbowY);
  ctx.strokeStyle = 'rgba(255,200,110,0.92)';
  ctx.lineWidth   = W * 0.055;
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur  = 10;
  ctx.stroke();

  // Lower arm
  ctx.beginPath();
  ctx.moveTo(elbowX, elbowY);
  ctx.lineTo(handX, handY);
  ctx.strokeStyle = 'rgba(255,200,110,0.92)';
  ctx.lineWidth   = W * 0.048;
  ctx.stroke();

  // ── Hand circle ─────────────────────────────────────────────────────
  ctx.beginPath();
  ctx.arc(handX, handY, W * 0.045, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,210,130,0.95)';
  ctx.shadowBlur = 14;
  ctx.fill();

  // ── Pointing finger ──────────────────────────────────────────────────
  const fingerAngle = angle + fingerWag;
  const fingerLen   = W * 0.08;
  const fingerTipX  = handX + Math.cos(fingerAngle) * fingerLen;
  const fingerTipY  = handY + Math.sin(fingerAngle) * fingerLen;

  ctx.beginPath();
  ctx.moveTo(handX, handY);
  ctx.lineTo(fingerTipX, fingerTipY);
  ctx.strokeStyle = 'rgba(255,210,130,0.98)';
  ctx.lineWidth   = W * 0.028;
  ctx.shadowBlur  = 8;
  ctx.stroke();

  // Fingertip dot glow
  ctx.beginPath();
  ctx.arc(fingerTipX, fingerTipY, W * 0.018, 0, Math.PI * 2);
  const glow = ctx.createRadialGradient(fingerTipX, fingerTipY, 0, fingerTipX, fingerTipY, W * 0.032);
  glow.addColorStop(0, 'rgba(255,255,200,0.95)');
  glow.addColorStop(1, 'rgba(255,200,80,0)');
  ctx.fillStyle   = glow;
  ctx.shadowColor = 'rgba(255,230,100,0.8)';
  ctx.shadowBlur  = 18;
  ctx.fill();

  // ── Small animated dotted trail from finger to text area ─────────────
  const trailSteps = 5;
  for (let i = 0; i < trailSteps; i++) {
    const frac  = (i + 1) / (trailSteps + 1);
    const tx    = fingerTipX + (W * 0.5 - fingerTipX) * frac;
    const ty    = fingerTipY + (H * 0.28 - fingerTipY) * frac;
    const pulse = Math.abs(Math.sin(now * Math.PI * 3 - i * 0.6));
    ctx.beginPath();
    ctx.arc(tx, ty, W * 0.008 * (1 - frac * 0.5), 0, Math.PI * 2);
    ctx.fillStyle   = `rgba(255,230,100,${pulse * 0.7})`;
    ctx.shadowColor = 'rgba(255,200,50,0.6)';
    ctx.shadowBlur  = 10;
    ctx.globalAlpha = 0.6 * (1 - frac * 0.4);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

/* ── CHARACTER SETTINGS ── */
function drawCharacterSprite(ctx, W, H, now, mainBgKey, template, customSprites, animationEnabled = true) {
  let sprite = null;

  // Determine sprite source - user uploads override built-ins
  if (customSprites && customSprites.some(s => s instanceof Blob)) {
    const frameIdx = animationEnabled ? Math.floor(now * 4) % 3 : 0;
    let file = customSprites[frameIdx];
    if (!file) file = customSprites.find(s => s instanceof Blob);
    if (file) {
      const cacheKey = file.name + file.size;
      sprite = custom_sprite_cache[cacheKey];
      if (!sprite) {
        sprite = new Image();
        sprite.src = URL.createObjectURL(file);
        custom_sprite_cache[cacheKey] = sprite;
      }
    }
  } else {
    let charKey = 'shinchan';
    if (mainBgKey === 'bheem')  charKey = 'bheem';
    if (mainBgKey === 'ben10')  charKey = 'ben10';
    if (mainBgKey === 'jackie') charKey = 'jackie';
    const frameIdx = animationEnabled ? Math.floor(now * 4) % 3 : 0;
    sprite = getImage(`${charKey}_${frameIdx}`);
  }

  // Gentle idle bob + breathe — character stays anchored bottom-right
  const bobY        = animationEnabled ? Math.sin(now * Math.PI * 2.5) * (H * 0.012) : 0;
  const breathScale = animationEnabled ? 1 + Math.sin(now * Math.PI * 1.2) * 0.018   : 1;

  // Position: bottom-right, slightly inset
  const charCX = W * 0.72;
  const charCY = H * 0.78 + bobY;

  // Draw character sprite
  ctx.save();
  ctx.translate(charCX, charCY);
  ctx.scale(breathScale, breathScale);
  ctx.globalAlpha = 1;

  if (sprite && sprite.complete && sprite.naturalWidth > 0) {
    const sh = H * 0.38; // smaller — just lower body visible
    const sw = sprite.width * (sh / sprite.height);
    ctx.drawImage(sprite, -sw / 2, -sh / 2, sw, sh);
  } else {
    // Loading placeholder
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    const sh = H * 0.38; const sw = sh * 0.6;
    ctx.fillRect(-sw/2, -sh/2, sw, sh);
  }
  ctx.restore();

  // Draw the animated hand gesture pointing toward text
  drawHandGesture(ctx, W, H, now, animationEnabled);
}

export function drawFrame(canvas, now, template, text, customSprites = [], animationEnabled = true, customMedia = null, customMediaCrop = null, sections = null, lang = 'en') {
  const ctx = canvas.getContext('2d', { alpha: false });
  const W = canvas.width, H = canvas.height;
  const sceneList = template.scenes || Array(5).fill({ type: 'generic', duration: 3 });

  // Find active scene
  let elapsed = 0, activeScene = sceneList[0], sceneT = 0, sceneIdx = 0;
  for (let i = 0; i < sceneList.length; i++) {
    const sc = sceneList[i];
    if (now < elapsed + sc.duration) {
      sceneT = (now - elapsed) / sc.duration;
      activeScene = sc; sceneIdx = i; break;
    }
    elapsed += sc.duration;
    activeScene = sc; sceneIdx = i; sceneT = 1;
  }
  sceneT = clamp(sceneT, 0, 1);

  // Find background image key (STRICTLY tied to the genre)
  const mainBgKey = TEMPLATE_BG[template.id] || 'shinchan';
  let img = getImage(mainBgKey);

  // If Admin assigned a remote dynamic background URL, use on-the-fly crossOrigin caching
  if (template.isCustom && template.bg) {
    if (kb_custom_bg_cache[template.bg]) {
      img = kb_custom_bg_cache[template.bg];
    } else {
      img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = template.bg;
      kb_custom_bg_cache[template.bg] = img;
    }
  }

  // Ken Burns mode cycles through scenes
  const kbMode = KB_MODE[sceneIdx % KB_MODE.length];

  // ── 1. Draw Background ─────────────────────────────────────────────
  ctx.save();

  if (customMedia) {
    // User-uploaded custom background (image or video)
    const cacheKey = customMedia.name + '|' + customMedia.size;
    let mediaEl = custom_media_cache[cacheKey];

    if (!mediaEl) {
      const mediaType = customMedia.type.startsWith('video/') ? 'video' : 'image';
      if (mediaType === 'video') {
        mediaEl = document.createElement('video');
        mediaEl.src = URL.createObjectURL(customMedia);
        mediaEl.loop = true;
        mediaEl.muted = true;
        mediaEl.playsInline = true;
        mediaEl.play().catch(() => {});
      } else {
        mediaEl = new Image();
        mediaEl.src = URL.createObjectURL(customMedia);
      }
      custom_media_cache[cacheKey] = mediaEl;
    }

    // Draw custom media with user crop/position applied
    const cropX     = customMediaCrop?.x ?? 0;
    const cropY     = customMediaCrop?.y ?? 0;
    const cropScale = customMediaCrop?.scale ?? 1;

    const isReady = mediaEl instanceof HTMLVideoElement
      ? mediaEl.readyState >= 2
      : (mediaEl.complete && mediaEl.naturalWidth > 0);

    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, W, H);

    if (isReady) {
      const mW = mediaEl instanceof HTMLVideoElement ? mediaEl.videoWidth  : mediaEl.naturalWidth;
      const mH = mediaEl instanceof HTMLVideoElement ? mediaEl.videoHeight : mediaEl.naturalHeight;

      // Cover-fit at scale 1, then apply user scale + position centered
      const baseFit = Math.max(W / mW, H / mH);
      const finalScale = baseFit * cropScale;
      const dw = mW * finalScale;
      const dh = mH * finalScale;
      const dx = (W - dw) / 2 + cropX;
      const dy = (H - dh) / 2 + cropY;

      ctx.drawImage(mediaEl, dx, dy, dw, dh);
    }

    // Subtle darkening overlay so text/characters remain readable
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(0, 0, W, H);
  } else {
    drawBg(ctx, W, H, img, sceneT, kbMode);
  }
  ctx.restore();

  // 2. Scene overlay (Particles, color grading, which act as mid/foreground)
  ctx.save();
  const renderer = SCENES[activeScene.type];
  if (renderer) renderer(ctx, W, H, sceneT, template, now, text);
  else colorGrade(ctx, W, H, 'rgba(0,0,0,0.3)', 1);
  ctx.restore();

  // 3. Draw Character Sprite Layer
  const hasUserSprites = customSprites && customSprites.some(s => s);
  if ((template.category === 'cartoon' && !hasUserSprites) || hasUserSprites) {
    drawCharacterSprite(ctx, W, H, now, mainBgKey, template, customSprites, animationEnabled);
  }

  // 4. Draw text — use sections if any section has content, else legacy text
  const hasSections = sections && (
    (sections.title?.text || '').trim() ||
    (sections.content?.text || '').trim() ||
    (sections.conclusion?.text || '').trim()
  );
  if (hasSections) {
    drawSections(ctx, W, H, sections, now, lang);
  } else {
    drawCinematicText(ctx, W, H, text, now);
  }

  // Fade in/out between scenes to eliminate flicker
  const fadeT = sceneT;
  if (fadeT < 0.08) {
    ctx.fillStyle = `rgba(0,0,0,${1 - fadeT / 0.08})`;
    ctx.fillRect(0, 0, W, H);
  } else if (fadeT > 0.92) {
    ctx.fillStyle = `rgba(0,0,0,${(fadeT - 0.92) / 0.08})`;
    ctx.fillRect(0, 0, W, H);
  }
}

export function startPreviewRender(canvas, template, text, customSprites = [], animationEnabled = true, customMedia = null, customMediaCrop = null, sections = null, lang = 'en') {
  let start = null, raf = null;
  const tick = (ts) => {
    if (!start) start = ts;
    drawFrame(canvas, ((ts - start) / 1000) % 15, template, text, customSprites, animationEnabled, customMedia, customMediaCrop, sections, lang);
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => { if (raf) cancelAnimationFrame(raf); };
}
