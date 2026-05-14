// Parses "YYYY-MM-DD" safely without timezone issues
function parseDateStr(str) {
  if (!str || typeof str !== 'string') return null;
  const parts = str.split('-');
  if (parts.length < 3) return null;
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);
  if (isNaN(m) || isNaN(d)) return null;
  return { m, d };
}

// "5월28일"
export function fmtDate(dateStr) {
  const p = parseDateStr(dateStr);
  return p ? `${p.m}월${p.d}일` : '-';
}

// "5월28일 오전 11시30분" or "5월28일 오후 2시"
export function fmtDateTime(dateStr, timeStr) {
  const p = parseDateStr(dateStr);
  if (!p) return '';
  const base = `${p.m}월${p.d}일`;
  if (!timeStr || typeof timeStr !== 'string') return base;
  const tp = timeStr.split(':');
  if (tp.length < 2) return base;
  const h = parseInt(tp[0], 10);
  const min = parseInt(tp[1], 10);
  if (isNaN(h)) return base;
  const period = h < 12 ? '오전' : '오후';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const timePart = min > 0 ? `${period} ${h12}시${min}분` : `${period} ${h12}시`;
  return `${base} ${timePart}`;
}

// "26.05.28" compact
export function fmtShort(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return '-';
  const parts = dateStr.split('-');
  if (parts.length < 3) return '-';
  return `${parts[0].slice(2)}.${parts[1]}.${parts[2]}`;
}
