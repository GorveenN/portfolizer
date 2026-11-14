/**
 * Interaktywny silnik wykresów High-DPI Canvas (Zero zewnętrznych zależności, 100% odporności offline)
 */

export function formatPLN(val, compact = false) {
  if (val === null || val === undefined || isNaN(val)) return '0 zł';
  const abs = Math.abs(val);
  const sign = val < 0 ? '-' : '';
  if (compact) {
    if (abs >= 1_000_000) {
      return `${sign}${(abs / 1_000_000).toFixed(2).replace('.', ',')} mln zł`;
    }
    if (abs >= 1_000) {
      return `${sign}${Math.round(abs / 1_000)} tys. zł`;
    }
  }
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    maximumFractionDigits: 0
  }).format(val);
}

function setupHiDPICanvas(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(200, rect.width || 600);
  const height = Math.max(150, rect.height || 340);

  if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, width, height };
}

/**
 * Rysuje wieloseryjny wykres liniowo-warstwowy z interaktywnym kursorem i dymkiem (tooltipem).
 */
export function renderLineChart(canvas, tooltipEl, config) {
  const {
    labels,
    series,
    yFormatter = (v) => formatPLN(v, true),
    tooltipFormatter = (v) => formatPLN(v, false)
  } = config;

  const state = { hoverIndex: null };

  function draw() {
    const { ctx, width, height } = setupHiDPICanvas(canvas);
    ctx.clearRect(0, 0, width, height);

    const padLeft = 78;
    const padRight = 20;
    const padTop = 20;
    const padBottom = 34;
    const plotW = Math.max(50, width - padLeft - padRight);
    const plotH = Math.max(50, height - padTop - padBottom);

    let minVal = 0;
    let maxVal = 0;
    series.forEach((s) => {
      s.data.forEach((v) => {
        if (v < minVal) minVal = v;
        if (v > maxVal) maxVal = v;
      });
    });

    if (maxVal === minVal) maxVal = minVal + 10;
    const yMax = maxVal > 0 ? maxVal * 1.06 : 0;
    const yMin = minVal < 0 ? minVal * 1.08 : 0;
    const totalSpan = yMax - yMin || 1;

    const toX = (i) => padLeft + (i / Math.max(1, labels.length - 1)) * plotW;
    const toY = (v) => padTop + plotH - ((v - yMin) / totalSpan) * plotH;

    const gridSteps = 5;
    ctx.font = '11px Inter, system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    for (let i = 0; i <= gridSteps; i++) {
      const val = yMin + (totalSpan * i) / gridSteps;
      const y = toY(val);

      ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(width - padRight, y);
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.fillText(yFormatter(val), padLeft - 8, y);
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const totalPoints = labels.length;
    const maxTicks = Math.min(10, Math.floor(plotW / 68));
    const step = Math.max(1, Math.ceil((totalPoints - 1) / maxTicks));

    for (let i = 0; i < totalPoints; i += step) {
      const x = toX(i);
      ctx.fillStyle = '#64748b';
      ctx.fillText(labels[i], x, padTop + plotH + 10);
    }

    const zeroY = toY(0);

    series.forEach((s) => {
      if (!s.fill || !s.data.length) return;
      ctx.save();
      ctx.beginPath();
      s.data.forEach((v, i) => {
        const x = toX(i);
        const y = toY(v);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.lineTo(toX(s.data.length - 1), zeroY);
      ctx.lineTo(toX(0), zeroY);
      ctx.closePath();

      const grad = ctx.createLinearGradient(0, padTop, 0, padTop + plotH);
      grad.addColorStop(0, hexToRgba(s.color, 0.26));
      grad.addColorStop(1, hexToRgba(s.color, 0.02));
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();
    });

    series.forEach((s) => {
      if (!s.data.length) return;
      ctx.save();
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.width || 2.2;
      if (s.dashed) {
        ctx.setLineDash([6, 4]);
      }
      ctx.beginPath();
      s.data.forEach((v, i) => {
        const x = toX(i);
        const y = toY(v);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.restore();
    });

    if (state.hoverIndex !== null && state.hoverIndex >= 0 && state.hoverIndex < labels.length) {
      const hi = state.hoverIndex;
      const hx = toX(hi);

      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(hx, padTop);
      ctx.lineTo(hx, padTop + plotH);
      ctx.stroke();
      ctx.restore();

      series.forEach((s) => {
        const val = s.data[hi];
        if (val === undefined) return;
        const hy = toY(val);
        ctx.save();
        ctx.fillStyle = s.color;
        ctx.strokeStyle = '#0b0f19';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(hx, hy, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      });
    }
  }

  canvas.onmousemove = (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const padLeft = 78;
    const padRight = 20;
    const plotW = Math.max(50, rect.width - padLeft - padRight);

    const relX = Math.max(0, Math.min(1, (mx - padLeft) / plotW));
    const idx = Math.round(relX * (labels.length - 1));
    state.hoverIndex = idx;
    draw();

    if (tooltipEl) {
      tooltipEl.style.display = 'block';
      let html = `<div class="tooltip-title">Okres: ${labels[idx]}</div>`;
      series.forEach((s) => {
        const val = s.data[idx];
        html += `
          <div class="tooltip-row">
            <span style="display:flex;align-items:center;gap:6px;">
              <span style="width:8px;height:8px;border-radius:50%;background:${s.color};display:inline-block;"></span>
              ${s.name}:
            </span>
            <strong>${tooltipFormatter(val, idx)}</strong>
          </div>
        `;
      });
      tooltipEl.innerHTML = html;

      const tipWidth = 250;
      const leftPos = (mx + tipWidth + 25 > rect.width) ? Math.max(10, mx - tipWidth - 15) : mx + 15;
      tooltipEl.style.left = `${leftPos}px`;
      tooltipEl.style.top = `18px`;
    }
  };

  canvas.onmouseleave = () => {
    state.hoverIndex = null;
    if (tooltipEl) tooltipEl.style.display = 'none';
    draw();
  };

  draw();
}

/**
 * Rysuje wykres słupkowy rocznych stóp zwrotu (np. lata kalendarzowe 2000–2026)
 */
export function renderBarChart(canvas, tooltipEl, config) {
  const { labels, values, name = 'Stopa zwrotu roczna' } = config;
  const state = { hoverIndex: null };

  function draw() {
    const { ctx, width, height } = setupHiDPICanvas(canvas);
    ctx.clearRect(0, 0, width, height);

    const padLeft = 65;
    const padRight = 20;
    const padTop = 20;
    const padBottom = 34;
    const plotW = Math.max(50, width - padLeft - padRight);
    const plotH = Math.max(50, height - padTop - padBottom);

    const minVal = Math.min(-5, ...values) * 1.12;
    const maxVal = Math.max(5, ...values) * 1.12;
    const span = maxVal - minVal || 1;

    const toY = (v) => padTop + plotH - ((v - minVal) / span) * plotH;
    const zeroY = toY(0);

    // Siatka
    ctx.font = '11px Inter, system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i = 0; i <= 5; i++) {
      const val = minVal + (span * i) / 5;
      const y = toY(val);
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)';
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(width - padRight, y);
      ctx.stroke();
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`${val.toFixed(0)}%`, padLeft - 8, y);
    }

    // Linia 0%
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padLeft, zeroY);
    ctx.lineTo(width - padRight, zeroY);
    ctx.stroke();

    const n = labels.length;
    const slotW = plotW / Math.max(1, n);
    const barW = Math.max(4, slotW * 0.68);

    labels.forEach((lbl, i) => {
      const val = values[i] || 0;
      const x = padLeft + i * slotW + (slotW - barW) / 2;
      const yVal = toY(val);
      const top = Math.min(zeroY, yVal);
      const barH = Math.max(2, Math.abs(zeroY - yVal));

      const isHovered = state.hoverIndex === i;
      ctx.fillStyle = val >= 0
        ? (isHovered ? '#34d399' : '#10b981')
        : (isHovered ? '#fb7185' : '#f43f5e');

      ctx.fillRect(x, top, barW, barH);

      if (i % 2 === 0 || n <= 16) {
        ctx.fillStyle = '#64748b';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(lbl, x + barW / 2, padTop + plotH + 8);
      }
    });
  }

  canvas.onmousemove = (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const padLeft = 65;
    const padRight = 20;
    const plotW = Math.max(50, rect.width - padLeft - padRight);
    const relX = (mx - padLeft) / plotW;
    if (relX < 0 || relX > 1) {
      state.hoverIndex = null;
      if (tooltipEl) tooltipEl.style.display = 'none';
      draw();
      return;
    }
    const idx = Math.min(labels.length - 1, Math.max(0, Math.floor(relX * labels.length)));
    state.hoverIndex = idx;
    draw();

    if (tooltipEl) {
      const val = values[idx] || 0;
      tooltipEl.style.display = 'block';
      tooltipEl.innerHTML = `
        <div class="tooltip-title">Rok ${labels[idx]}</div>
        <div class="tooltip-row">
          <span>${name}:</span>
          <strong style="color:${val >= 0 ? '#34d399' : '#fb7185'}">${val >= 0 ? '+' : ''}${val.toFixed(2)}%</strong>
        </div>
      `;
      const tipWidth = 210;
      const leftPos = (mx + tipWidth + 25 > rect.width) ? Math.max(10, mx - tipWidth - 15) : mx + 15;
      tooltipEl.style.left = `${leftPos}px`;
      tooltipEl.style.top = `18px`;
    }
  };

  canvas.onmouseleave = () => {
    state.hoverIndex = null;
    if (tooltipEl) tooltipEl.style.display = 'none';
    draw();
  };

  draw();
}

/**
 * Rysuje skumulowany wykres warstwowy (Stacked Area) pokazujący udział poszczególnych klas aktywów w czasie.
 */
export function renderStackedAreaChart(canvas, tooltipEl, config) {
  const { labels, layers } = config;
  const state = { hoverIndex: null };

  function draw() {
    const { ctx, width, height } = setupHiDPICanvas(canvas);
    ctx.clearRect(0, 0, width, height);

    const padLeft = 78;
    const padRight = 20;
    const padTop = 18;
    const padBottom = 32;
    const plotW = Math.max(50, width - padLeft - padRight);
    const plotH = Math.max(50, height - padTop - padBottom);

    const n = labels.length;
    const totals = new Array(n).fill(0);
    layers.forEach((l) => {
      for (let i = 0; i < n; i++) {
        totals[i] += l.data[i] || 0;
      }
    });

    const yMax = Math.max(100, ...totals) * 1.05;
    const toX = (i) => padLeft + (i / Math.max(1, n - 1)) * plotW;
    const toY = (v) => padTop + plotH - (v / yMax) * plotH;

    ctx.font = '11px Inter, system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i = 0; i <= 4; i++) {
      const val = (yMax * i) / 4;
      const y = toY(val);
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)';
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(width - padRight, y);
      ctx.stroke();
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(formatPLN(val, true), padLeft - 8, y);
    }

    const cumulativeBottom = new Array(n).fill(0);
    const cumulativeTop = new Array(n).fill(0);

    layers.forEach((layer) => {
      for (let i = 0; i < n; i++) {
        cumulativeTop[i] = cumulativeBottom[i] + (layer.data[i] || 0);
      }

      ctx.save();
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const x = toX(i);
        const y = toY(cumulativeTop[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      for (let i = n - 1; i >= 0; i--) {
        ctx.lineTo(toX(i), toY(cumulativeBottom[i]));
      }
      ctx.closePath();
      ctx.fillStyle = hexToRgba(layer.color, 0.55);
      ctx.fill();

      ctx.strokeStyle = layer.color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const x = toX(i);
        const y = toY(cumulativeTop[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();

      for (let i = 0; i < n; i++) {
        cumulativeBottom[i] = cumulativeTop[i];
      }
    });

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const step = Math.max(1, Math.ceil((n - 1) / 8));
    for (let i = 0; i < n; i += step) {
      ctx.fillStyle = '#64748b';
      ctx.fillText(labels[i], toX(i), padTop + plotH + 8);
    }

    if (state.hoverIndex !== null) {
      const hx = toX(state.hoverIndex);
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(hx, padTop);
      ctx.lineTo(hx, padTop + plotH);
      ctx.stroke();
      ctx.restore();
    }
  }

  canvas.onmousemove = (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const padLeft = 78;
    const padRight = 20;
    const plotW = Math.max(50, rect.width - padLeft - padRight);
    const relX = Math.max(0, Math.min(1, (mx - padLeft) / plotW));
    const idx = Math.round(relX * (labels.length - 1));
    state.hoverIndex = idx;
    draw();

    if (tooltipEl) {
      tooltipEl.style.display = 'block';
      const total = layers.reduce((s, l) => s + (l.data[idx] || 0), 0) || 1;
      let html = `<div class="tooltip-title">${labels[idx]} (Razem Brutto: ${formatPLN(total)})</div>`;
      layers.slice().reverse().forEach((l) => {
        const val = l.data[idx] || 0;
        if (val <= 0.01) return;
        const pct = ((val / total) * 100).toFixed(1);
        html += `
          <div class="tooltip-row">
            <span style="display:flex;align-items:center;gap:6px;">
              <span style="width:8px;height:8px;border-radius:50%;background:${l.color};display:inline-block;"></span>
              ${l.name}:
            </span>
            <strong>${formatPLN(val)} (${pct}%)</strong>
          </div>
        `;
      });
      tooltipEl.innerHTML = html;
      const tipWidth = 260;
      const leftPos = (mx + tipWidth + 25 > rect.width) ? Math.max(10, mx - tipWidth - 15) : mx + 15;
      tooltipEl.style.left = `${leftPos}px`;
      tooltipEl.style.top = `15px`;
    }
  };

  canvas.onmouseleave = () => {
    state.hoverIndex = null;
    if (tooltipEl) tooltipEl.style.display = 'none';
    draw();
  };

  draw();
}

/**
 * Rysuje wykres kołowy (Donut) alokacji portfela
 */
export function renderDonutChart(canvas, slices, centerTitle, centerSub) {
  const { ctx, width, height } = setupHiDPICanvas(canvas);
  ctx.clearRect(0, 0, width, height);

  const cx = width / 2;
  const cy = height / 2;
  const outerR = Math.min(width, height) * 0.42;
  const innerR = outerR * 0.64;

  const total = slices.reduce((s, item) => s + item.value, 0) || 1;
  let startAngle = -Math.PI / 2;

  slices.forEach((slice) => {
    if (slice.value <= 0) return;
    const sweep = (slice.value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, startAngle, startAngle + sweep);
    ctx.arc(cx, cy, innerR, startAngle + sweep, startAngle, true);
    ctx.closePath();
    ctx.fillStyle = slice.color;
    ctx.fill();

    ctx.strokeStyle = '#161f33';
    ctx.lineWidth = 2;
    ctx.stroke();

    startAngle += sweep;
  });

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 16px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(centerTitle, cx, cy - 8);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px Inter, system-ui, sans-serif';
  ctx.fillText(centerSub, cx, cy + 12);
}

/**
 * Rysuje interaktywny Histogram rozkładu zwrotów dla wszystkich N-letnich okresów historycznych
 * z możliwością bezpośredniego nałożenia bezpiecznego portfela 100% Obligacji EDO
 */
export function renderHistogramChart(canvas, tooltipEl, config) {
  const {
    bins = [],
    totalWindows = 1,
    minVal = 0,
    maxVal = 100,
    targetValue = 0,
    medianVal = 0,
    edoMedianVal = null,
    showEdoComparison = true,
    valueFormatter = (v) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`
  } = config;

  const state = { hoverIndex: null };

  function draw() {
    const { ctx, width, height } = setupHiDPICanvas(canvas);
    ctx.clearRect(0, 0, width, height);

    if (!bins.length) return;

    const padLeft = 58;
    const padRight = 24;
    const padTop = 30;
    const padBottom = 42;
    const plotW = Math.max(50, width - padLeft - padRight);
    const plotH = Math.max(50, height - padTop - padBottom);

    const maxBinPct = Math.max(
      5,
      ...bins.map((b) => Math.max(b.pct || 0, showEdoComparison ? (b.edoPct || 0) : 0))
    );
    const maxPct = maxBinPct * 1.16;
    const toY = (pct) => padTop + plotH - (pct / maxPct) * plotH;
    const span = maxVal - minVal || 1;
    const toValX = (val) => padLeft + Math.max(0, Math.min(1, (val - minVal) / span)) * plotW;

    // Siatka pozioma (% okresów)
    ctx.font = '11px Inter, system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i = 0; i <= 4; i++) {
      const pctVal = (maxPct * i) / 4;
      const y = toY(pctVal);
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(width - padRight, y);
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`${pctVal.toFixed(0)}%`, padLeft - 8, y);
    }

    const n = bins.length;
    const slotW = plotW / n;
    const barW = Math.max(6, slotW - 4);

    bins.forEach((b, i) => {
      const x = padLeft + i * slotW + 2;
      const isHovered = state.hoverIndex === i;

      if (showEdoComparison) {
        const subW = Math.max(3, (barW - 2) / 2);

        // 1. Słupek Twojego Portfela (lewa połowa koszyka)
        const yUser = toY(b.pct);
        const hUser = Math.max(b.count > 0 ? 2 : 0, padTop + plotH - yUser);
        let fillUser;
        if (b.center < 0) {
          fillUser = isHovered ? '#fb7185' : 'rgba(244, 63, 94, 0.82)';
        } else if (b.center >= targetValue) {
          fillUser = isHovered ? '#34d399' : 'rgba(16, 185, 129, 0.85)';
        } else {
          fillUser = isHovered ? '#60a5fa' : 'rgba(59, 130, 246, 0.78)';
        }

        if (hUser > 0) {
          ctx.fillStyle = fillUser;
          ctx.fillRect(x, yUser, subW, hUser);
          ctx.strokeStyle = b.center < 0 ? '#f43f5e' : b.center >= targetValue ? '#10b981' : '#3b82f6';
          ctx.lineWidth = isHovered ? 1.8 : 1;
          ctx.strokeRect(x, yUser, subW, hUser);
        }

        // 2. Słupek Bezpiecznego Portfela 100% EDO (prawa połowa koszyka - kolor cyjan/turkus)
        const yEdo = toY(b.edoPct || 0);
        const hEdo = Math.max((b.edoCount || 0) > 0 ? 2 : 0, padTop + plotH - yEdo);
        if (hEdo > 0) {
          ctx.fillStyle = isHovered ? '#22d3ee' : 'rgba(6, 182, 212, 0.62)';
          ctx.fillRect(x + subW + 2, yEdo, subW, hEdo);
          ctx.strokeStyle = '#06b6d4';
          ctx.lineWidth = isHovered ? 1.8 : 1;
          ctx.strokeRect(x + subW + 2, yEdo, subW, hEdo);
        }

        // Etykieta % nad słupkiem Twojego Portfela
        if (b.count > 0) {
          ctx.fillStyle = '#e2e8f0';
          ctx.font = '9.5px Inter, system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText(`${b.pct.toFixed(0)}%`, x + subW / 2, yUser - 2);
        }
      } else {
        const y = toY(b.pct);
        const barH = Math.max(2, padTop + plotH - y);

        let fillColor;
        if (b.center < 0) {
          fillColor = isHovered ? '#fb7185' : 'rgba(244, 63, 94, 0.78)';
        } else if (b.center >= targetValue) {
          fillColor = isHovered ? '#34d399' : 'rgba(16, 185, 129, 0.82)';
        } else {
          fillColor = isHovered ? '#60a5fa' : 'rgba(59, 130, 246, 0.72)';
        }

        ctx.fillStyle = fillColor;
        ctx.fillRect(x, y, barW, barH);

        ctx.strokeStyle = b.center < 0 ? '#f43f5e' : b.center >= targetValue ? '#10b981' : '#3b82f6';
        ctx.lineWidth = isHovered ? 2 : 1;
        ctx.strokeRect(x, y, barW, barH);

        if (b.count > 0) {
          ctx.fillStyle = '#cbd5e1';
          ctx.font = '10px Inter, system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText(`${b.pct.toFixed(0)}%`, x + barW / 2, y - 3);
        }
      }

      // Etykiety osi X co 2 koszyki
      if (i % 2 === 0 || i === n - 1) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10.5px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(valueFormatter(b.center), x + barW / 2, padTop + plotH + 10);
      }
    });

    // Pionowa linia: Mediana bezpiecznego portfela 100% EDO
    if (showEdoComparison && edoMedianVal !== null && edoMedianVal >= minVal && edoMedianVal <= maxVal) {
      const ex = toValX(edoMedianVal);
      ctx.save();
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(ex, padTop + 12);
      ctx.lineTo(ex, padTop + plotH);
      ctx.stroke();

      ctx.fillStyle = '#22d3ee';
      ctx.font = 'bold 10px Inter, system-ui, sans-serif';
      ctx.textAlign = ex < padLeft + 90 ? 'left' : 'right';
      ctx.textBaseline = 'top';
      ctx.fillText(`Mediana EDO: ${valueFormatter(edoMedianVal)}`, ex + (ex < padLeft + 90 ? 4 : -4), padTop + 2);
      ctx.restore();
    }

    // Pionowa linia: Próg docelowy użytkownika (targetValue)
    if (targetValue >= minVal && targetValue <= maxVal) {
      const tx = toValX(targetValue);
      ctx.save();
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(tx, padTop - 4);
      ctx.lineTo(tx, padTop + plotH);
      ctx.stroke();

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 11px Inter, system-ui, sans-serif';
      ctx.textAlign = tx > width - 120 ? 'right' : 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`Twój próg: ${valueFormatter(targetValue)}`, tx + (tx > width - 120 ? -4 : 4), padTop - 5);
      ctx.restore();
    }

    // Pionowa linia: Mediana Twojego Portfela (50. percentyl)
    if (medianVal >= minVal && medianVal <= maxVal) {
      const mx = toValX(medianVal);
      ctx.save();
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(mx, padTop + 10);
      ctx.lineTo(mx, padTop + plotH);
      ctx.stroke();
      ctx.restore();
    }
  }

  canvas.onmousemove = (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const padLeft = 58;
    const padRight = 24;
    const plotW = Math.max(50, rect.width - padLeft - padRight);
    const relX = (mx - padLeft) / plotW;

    if (relX < 0 || relX > 1 || !bins.length) {
      state.hoverIndex = null;
      if (tooltipEl) tooltipEl.style.display = 'none';
      draw();
      return;
    }

    const idx = Math.min(bins.length - 1, Math.max(0, Math.floor(relX * bins.length)));
    state.hoverIndex = idx;
    draw();

    if (tooltipEl) {
      const b = bins[idx];
      tooltipEl.style.display = 'block';
      tooltipEl.innerHTML = `
        <div class="tooltip-title">Przedział: ${valueFormatter(b.min)} do ${valueFormatter(b.max)}</div>
        <div class="tooltip-row">
          <span class="tooltip-label"><span class="tooltip-dot" style="background:#3b82f6"></span>Twój Portfel:</span>
          <strong>${b.count} z ${totalWindows} (${b.pct.toFixed(1)}%)</strong>
        </div>
        ${showEdoComparison ? `
        <div class="tooltip-row">
          <span class="tooltip-label"><span class="tooltip-dot" style="background:#22d3ee"></span>100% Obligacje EDO:</span>
          <strong style="color:#22d3ee">${b.edoCount || 0} z ${totalWindows} (${(b.edoPct || 0).toFixed(1)}%)</strong>
        </div>` : ''}
        ${b.samples.length ? `<div style="margin-top:4px;font-size:0.7rem;color:#94a3b8;">Twój Portfel (przykłady): ${b.samples.join(', ')}</div>` : ''}
        ${showEdoComparison && b.edoSamples?.length ? `<div style="margin-top:2px;font-size:0.7rem;color:#67e8f9;">100% EDO (przykłady): ${b.edoSamples.join(', ')}</div>` : ''}
      `;
      const tipWidth = 275;
      const leftPos = (mx + tipWidth + 25 > rect.width) ? Math.max(10, mx - tipWidth - 15) : mx + 15;
      tooltipEl.style.left = `${leftPos}px`;
      tooltipEl.style.top = `16px`;
    }
  };

  canvas.onmouseleave = () => {
    state.hoverIndex = null;
    if (tooltipEl) tooltipEl.style.display = 'none';
    draw();
  };

  draw();
}

function hexToRgba(hex, alpha) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
