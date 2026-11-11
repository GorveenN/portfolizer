import {
  ASSETS,
  EQUITY_IDS,
  PRESET_STRATEGIES,
  generateMarketEnvironment,
  simulatePortfolio,
  analyzeHistoricalRiskAndDrawdowns
} from './financeEngine.js';
import {
  renderLineChart,
  renderBarChart,
  renderStackedAreaChart,
  renderDonutChart,
  formatPLN
} from './chartEngine.js';

const state = {
  presetId: 'custom',
  weights: {
    sp500: 30,
    nasdaq100: 15,
    msci_world: 0,
    msci_momentum: 15,
    msci_acwi: 10,
    edo: 30
  },
  autoNormalize: true,
  startYear: 2010,
  startMonth: 1,
  endYear: 2026,
  endMonth: 10,
  initialCapital: 10000,
  monthlyContribution: 1500,
  indexContributions: true,
  indexationMode: 'annual',
  years: 16.75,
  baseInflation: 3.5,
  edoYear1Rate: 6.55,
  edoMargin: 1.50,
  taxAccount: 'standard',
  ikzeTaxBracket: 12,
  rebalanceMode: 'contributions',
  marketMode: 'historical', // 'historical' | 'historical_usd' | 'bootstrap' | 'deterministic'
  seed: 1337,
  valueDisplayMode: 'nominal',
  activeMainChartTab: 'wealth',
  compareBenchmarkId: 'core_momentum_edo',
  customReturns: {
    sp500: ASSETS.sp500.defaultReturn,
    nasdaq100: ASSETS.nasdaq100.defaultReturn,
    msci_world: ASSETS.msci_world.defaultReturn,
    msci_momentum: ASSETS.msci_momentum.defaultReturn,
    msci_acwi: ASSETS.msci_acwi.defaultReturn
  }
};

let lastSimulationResult = null;
let lastMarketEnv = null;

function initApp() {
  initGlobalHelpTooltips();
  renderPresets();
  renderAssetSliders();
  bindControls();
  runFullSimulation();

  window.addEventListener('resize', () => {
    if (lastSimulationResult) {
      updateCharts();
    }
  });
}

function initGlobalHelpTooltips() {
  const tipEl = document.getElementById('globalHelpTooltip');
  if (!tipEl) return;

  const positionTooltip = (e) => {
    const pad = 14;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const rect = tipEl.getBoundingClientRect();
    let left = e.clientX + pad;
    let top = e.clientY + pad;

    if (left + rect.width + 12 > vw) {
      left = Math.max(10, e.clientX - rect.width - pad);
    }
    if (top + rect.height + 12 > vh) {
      top = Math.max(10, e.clientY - rect.height - pad);
    }
    tipEl.style.left = `${left}px`;
    tipEl.style.top = `${top}px`;
  };

  document.addEventListener('mouseover', (e) => {
    const target = e.target.closest('[data-tip-body]');
    if (!target) return;
    const title = target.getAttribute('data-tip-title') || 'Informacja';
    const body = target.getAttribute('data-tip-body') || '';
    const hint = target.getAttribute('data-tip-hint') || '';

    tipEl.innerHTML = `
      <div class="tip-header">💡 ${title}</div>
      <div class="tip-body">${body}</div>
      ${hint ? `<div class="tip-hint">👉 ${hint}</div>` : ''}
    `;
    tipEl.style.display = 'block';
    positionTooltip(e);
  });

  document.addEventListener('mousemove', (e) => {
    if (tipEl.style.display === 'block') {
      const target = e.target.closest('[data-tip-body]');
      if (!target) {
        tipEl.style.display = 'none';
      } else {
        positionTooltip(e);
      }
    }
  });

  document.addEventListener('mouseout', (e) => {
    const target = e.target.closest('[data-tip-body]');
    if (target && !target.contains(e.relatedTarget)) {
      tipEl.style.display = 'none';
    }
  });
}

function renderPresets() {
  const container = document.getElementById('presetGrid');
  if (!container) return;
  container.innerHTML = '';

  PRESET_STRATEGIES.forEach((preset) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `preset-btn ${state.presetId === preset.id ? 'active' : ''}`;
    btn.innerHTML = `
      <span class="preset-name">${preset.name}</span>
      <span class="preset-desc">${preset.desc}</span>
    `;
    btn.addEventListener('click', () => {
      state.presetId = preset.id;
      state.weights = { ...preset.weights };
      renderPresets();
      updateSlidersUI();
      runFullSimulation();
    });
    container.appendChild(btn);
  });
}

function renderAssetSliders() {
  const container = document.getElementById('assetSlidersContainer');
  if (!container) return;
  container.innerHTML = '';

  Object.values(ASSETS).forEach((asset) => {
    const row = document.createElement('div');
    row.className = 'asset-row';
    const rateLabel = asset.id === 'edo'
      ? `1. rok: ${state.edoYear1Rate}% | Lata 2-10: Inflacja GUS + ${state.edoMargin}%`
      : `Dane miesięczne 1985–2026 (501 mies.) | TER: ${asset.ter}%`;

    row.innerHTML = `
      <div class="asset-top">
        <div class="asset-label">
          <span class="asset-dot" style="background:${asset.color}"></span>
          <span>${asset.name}</span>
          <span class="asset-ticker">(${asset.ticker})</span>
        </div>
        <div class="asset-weight-input">
          <input type="number" min="0" max="100" step="1" class="weight-number" id="num_${asset.id}" value="${state.weights[asset.id]}" />
          <span style="font-size:0.8rem;color:var(--text-secondary);">%</span>
        </div>
      </div>
      <input type="range" min="0" max="100" step="1" id="range_${asset.id}" value="${state.weights[asset.id]}" style="accent-color:${asset.color}" />
      <div class="asset-meta">
        <span>${asset.description}</span>
      </div>
      <div class="asset-meta" style="color:#60a5fa;font-weight:500;">
        <span id="meta_${asset.id}">${rateLabel}</span>
      </div>
    `;

    container.appendChild(row);

    const rangeEl = row.querySelector(`#range_${asset.id}`);
    const numEl = row.querySelector(`#num_${asset.id}`);

    const onWeightChange = (newVal) => {
      const clamped = Math.max(0, Math.min(100, Number(newVal) || 0));
      adjustWeights(asset.id, clamped);
      state.presetId = 'custom';
      renderPresets();
      updateSlidersUI();
      runFullSimulation();
    };

    rangeEl.addEventListener('input', (e) => onWeightChange(e.target.value));
    numEl.addEventListener('change', (e) => onWeightChange(e.target.value));
  });

  updateAllocationBar();
}

function adjustWeights(changedId, newValue) {
  state.weights[changedId] = newValue;

  if (!state.autoNormalize) return;

  const otherIds = Object.keys(state.weights).filter((k) => k !== changedId);
  const currentOthersSum = otherIds.reduce((s, k) => s + state.weights[k], 0);
  const targetOthersSum = Math.max(0, 100 - newValue);

  if (currentOthersSum > 0) {
    let runningSum = newValue;
    otherIds.forEach((id, idx) => {
      if (idx === otherIds.length - 1) {
        state.weights[id] = Math.max(0, Math.round(100 - runningSum));
      } else {
        const scaled = Math.round((state.weights[id] / currentOthersSum) * targetOthersSum);
        state.weights[id] = scaled;
        runningSum += scaled;
      }
    });
  } else if (targetOthersSum > 0) {
    const fallbackId = changedId === 'edo' ? 'sp500' : 'edo';
    state.weights[fallbackId] = targetOthersSum;
  }
}

function updateSlidersUI() {
  Object.keys(ASSETS).forEach((id) => {
    const r = document.getElementById(`range_${id}`);
    const n = document.getElementById(`num_${id}`);
    if (r) r.value = state.weights[id];
    if (n) n.value = state.weights[id];

    const metaEl = document.getElementById(`meta_${id}`);
    if (metaEl) {
      metaEl.textContent = id === 'edo'
        ? `1. rok: ${state.edoYear1Rate}% | Lata 2-10: Inflacja GUS + ${state.edoMargin}%`
        : `Dane miesięczne 1985–2026 (501 mies.) | TER: ${ASSETS[id].ter}%`;
    }
  });
  updateAllocationBar();
}

function updateAllocationBar() {
  const bar = document.getElementById('allocBar');
  const sumEl = document.getElementById('allocSumBadge');
  if (!bar) return;

  const sum = Object.values(state.weights).reduce((a, b) => a + Number(b || 0), 0);
  bar.innerHTML = '';

  Object.values(ASSETS).forEach((asset) => {
    const w = state.weights[asset.id] || 0;
    if (w <= 0) return;
    const seg = document.createElement('div');
    seg.className = 'alloc-segment';
    seg.style.width = `${(w / Math.max(1, sum)) * 100}%`;
    seg.style.backgroundColor = asset.color;
    seg.title = `${asset.name}: ${w}%`;
    bar.appendChild(seg);
  });

  if (sumEl) {
    if (sum === 100) {
      sumEl.className = 'badge badge-success';
      sumEl.textContent = 'Suma wag: 100%';
    } else {
      sumEl.className = 'badge badge-warning';
      sumEl.textContent = `Suma: ${sum}% (przeskalowane do 100%)`;
    }
  }
}

function ensureValidDateOrder(changedSide = 'start') {
  const startTotal = state.startYear * 12 + (state.startMonth - 1);
  const endTotal = state.endYear * 12 + (state.endMonth - 1);

  if (endTotal <= startTotal) {
    if (changedSide === 'start') {
      const newEnd = startTotal + 12;
      state.endYear = Math.floor(newEnd / 12);
      state.endMonth = (newEnd % 12) + 1;
    } else {
      const newStart = Math.max(1985 * 12 + 1, endTotal - 12);
      state.startYear = Math.floor(newStart / 12);
      state.startMonth = (newStart % 12) + 1;
    }
  }

  const totalMonths = Math.max(1, (state.endYear - state.startYear) * 12 + (state.endMonth - state.startMonth));
  state.years = +(totalMonths / 12).toFixed(2);

  // Synchronizuj kontrolki formularza
  const syIn = document.getElementById('startYearInput');
  const syRg = document.getElementById('startYearRange');
  const smSel = document.getElementById('startMonthSelect');
  const eyIn = document.getElementById('endYearInput');
  const eyRg = document.getElementById('endYearRange');
  const emSel = document.getElementById('endMonthSelect');

  if (syIn && document.activeElement !== syIn) syIn.value = state.startYear;
  if (syRg && document.activeElement !== syRg) syRg.value = state.startYear;
  if (smSel && document.activeElement !== smSel) smSel.value = state.startMonth;
  if (eyIn && document.activeElement !== eyIn) eyIn.value = state.endYear;
  if (eyRg && document.activeElement !== eyRg) eyRg.value = state.endYear;
  if (emSel && document.activeElement !== emSel) emSel.value = state.endMonth;
}

function updatePeriodHeaderLabel() {
  const startLabel = document.getElementById('startDateVal');
  const endLabel = document.getElementById('endDateVal');
  const yearsLabel = document.getElementById('yearsVal');

  const sYM = `${state.startYear}-${String(state.startMonth).padStart(2, '0')}`;
  const eYM = `${state.endYear}-${String(state.endMonth).padStart(2, '0')}`;
  const totalMonths = Math.max(1, (state.endYear - state.startYear) * 12 + (state.endMonth - state.startMonth));
  const fullYears = Math.floor(totalMonths / 12);
  const remMonths = totalMonths % 12;

  if (startLabel) startLabel.textContent = sYM;
  if (endLabel) endLabel.textContent = eYM;
  if (yearsLabel) {
    const yrsPart = fullYears > 0 ? `${fullYears} lat` : '';
    const mosPart = remMonths > 0 ? `${fullYears > 0 ? ' i ' : ''}${remMonths} mies.` : '';
    yearsLabel.textContent = `${yrsPart}${mosPart} (${totalMonths} mies.: ${sYM} → ${eYM})`;
  }
}

function bindControls() {
  const autoNormEl = document.getElementById('autoNormalizeCheck');
  if (autoNormEl) {
    autoNormEl.checked = state.autoNormalize;
    autoNormEl.addEventListener('change', (e) => {
      state.autoNormalize = e.target.checked;
      if (state.autoNormalize) {
        normalizeAllTo100();
      }
    });
  }

  const normBtn = document.getElementById('btnNormalize100');
  if (normBtn) {
    normBtn.addEventListener('click', normalizeAllTo100);
  }

  // Powiązanie dokładnych dat: Rok + Miesiąc rozpoczęcia oraz Rok + Miesiąc zakończenia
  const onDateChange = (side) => {
    ensureValidDateOrder(side);
    updatePeriodHeaderLabel();
    runFullSimulation();
  };

  ['startYearInput', 'startYearRange'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', (e) => {
        state.startYear = Number(e.target.value) || 2010;
        onDateChange('start');
      });
    }
  });

  const smEl = document.getElementById('startMonthSelect');
  if (smEl) {
    smEl.addEventListener('change', (e) => {
      state.startMonth = Number(e.target.value) || 1;
      onDateChange('start');
    });
  }

  ['endYearInput', 'endYearRange'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', (e) => {
        state.endYear = Number(e.target.value) || 2026;
        onDateChange('end');
      });
    }
  });

  const emEl = document.getElementById('endMonthSelect');
  if (emEl) {
    emEl.addEventListener('change', (e) => {
      state.endMonth = Number(e.target.value) || 10;
      onDateChange('end');
    });
  }

  bindNumberAndRange('monthlyContributionInput', 'monthlyContributionRange', 'monthlyContributionVal', 'monthlyContribution', (v) => `${formatPLN(v)} / mies.`);
  bindNumberAndRange('initialCapitalInput', 'initialCapitalRange', 'initialCapitalVal', 'initialCapital', (v) => formatPLN(v));
  bindNumberAndRange(null, 'inflationRange', 'inflationVal', 'baseInflation', (v) => `${Number(v).toFixed(1)}% rocznie`);

  ensureValidDateOrder('start');
  updatePeriodHeaderLabel();

  const idxToggle = document.getElementById('indexContributionsToggle');
  const idxModeSelect = document.getElementById('indexationModeSelect');
  if (idxToggle) {
    idxToggle.checked = state.indexContributions;
    idxToggle.addEventListener('change', (e) => {
      state.indexContributions = e.target.checked;
      if (idxModeSelect) idxModeSelect.disabled = !state.indexContributions;
      runFullSimulation();
    });
  }
  if (idxModeSelect) {
    idxModeSelect.value = state.indexationMode;
    idxModeSelect.addEventListener('change', (e) => {
      state.indexationMode = e.target.value;
      runFullSimulation();
    });
  }

  document.querySelectorAll('.tax-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tax-tab').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.taxAccount = btn.dataset.tax;
      const ikzeBox = document.getElementById('ikzeOptionsBox');
      if (ikzeBox) {
        ikzeBox.style.display = state.taxAccount === 'ikze' ? 'block' : 'none';
      }
      runFullSimulation();
    });
  });

  const ikzeBracketEl = document.getElementById('ikzeBracketSelect');
  if (ikzeBracketEl) {
    ikzeBracketEl.addEventListener('change', (e) => {
      state.ikzeTaxBracket = Number(e.target.value);
      runFullSimulation();
    });
  }

  const rebalEl = document.getElementById('rebalanceSelect');
  if (rebalEl) {
    rebalEl.addEventListener('change', (e) => {
      state.rebalanceMode = e.target.value;
      runFullSimulation();
    });
  }

  const marketModeEl = document.getElementById('marketModeSelect');
  if (marketModeEl) {
    marketModeEl.addEventListener('change', (e) => {
      state.marketMode = e.target.value;
      const seedBtn = document.getElementById('btnNewRandomSeed');
      if (seedBtn) {
        seedBtn.style.display = state.marketMode === 'bootstrap' ? 'inline-flex' : 'none';
      }
      runFullSimulation();
    });
  }

  const seedBtn = document.getElementById('btnNewRandomSeed');
  if (seedBtn) {
    seedBtn.addEventListener('click', () => {
      state.seed = Math.floor(Math.random() * 900000) + 1000;
      runFullSimulation();
    });
  }

  ['edoYear1Rate', 'edoMargin'].forEach((field) => {
    const el = document.getElementById(`${field}Input`);
    if (el) {
      el.value = state[field];
      el.addEventListener('input', (e) => {
        state[field] = Number(e.target.value) || 0;
        updateSlidersUI();
        runFullSimulation();
      });
    }
  });

  EQUITY_IDS.forEach((id) => {
    const el = document.getElementById(`ret_${id}`);
    if (el) {
      el.value = state.customReturns[id];
      el.addEventListener('input', (e) => {
        state.customReturns[id] = Number(e.target.value) || 0;
        updateSlidersUI();
        runFullSimulation();
      });
    }
  });

  document.querySelectorAll('[data-valmode]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-valmode]').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.valueDisplayMode = btn.dataset.valmode;
      runFullSimulation();
    });
  });

  document.querySelectorAll('[data-charttab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-charttab]').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.activeMainChartTab = btn.dataset.charttab;
      updateCharts();
    });
  });

  const benchSelect = document.getElementById('benchmarkSelect');
  if (benchSelect) {
    benchSelect.addEventListener('change', (e) => {
      state.compareBenchmarkId = e.target.value;
      runFullSimulation();
    });
  }

  const exportBtn = document.getElementById('btnExportCSV');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportSimulationToCSV);
  }
}

function bindNumberAndRange(numId, rangeId, labelId, stateKey, formatterOrCallback) {
  const numEl = numId ? document.getElementById(numId) : null;
  const rangeEl = rangeId ? document.getElementById(rangeId) : null;
  const labelEl = labelId ? document.getElementById(labelId) : null;

  const update = (val) => {
    const num = Number(val);
    state[stateKey] = num;
    if (numEl && document.activeElement !== numEl) numEl.value = num;
    if (rangeEl && document.activeElement !== rangeEl) rangeEl.value = num;
    if (formatterOrCallback) {
      const res = formatterOrCallback(num);
      if (labelEl && typeof res === 'string') {
        labelEl.textContent = res;
      }
    }
    updateSlidersUI();
    runFullSimulation();
  };

  if (numEl) numEl.addEventListener('input', (e) => update(e.target.value));
  if (rangeEl) rangeEl.addEventListener('input', (e) => update(e.target.value));
}

function normalizeAllTo100() {
  const sum = Object.values(state.weights).reduce((a, b) => a + Number(b || 0), 0);
  if (sum <= 0) {
    state.weights = { sp500: 40, nasdaq100: 0, msci_world: 0, msci_momentum: 20, msci_acwi: 0, edo: 40 };
  } else {
    let running = 0;
    const keys = Object.keys(state.weights);
    keys.forEach((k, idx) => {
      if (idx === keys.length - 1) {
        state.weights[k] = Math.max(0, 100 - running);
      } else {
        const val = Math.round((state.weights[k] / sum) * 100);
        state.weights[k] = val;
        running += val;
      }
    });
  }
  updateSlidersUI();
  runFullSimulation();
}

function runFullSimulation() {
  const marketEnv = generateMarketEnvironment({
    startYear: state.startYear,
    startMonth: state.startMonth,
    endYear: state.endYear,
    endMonth: state.endMonth,
    years: state.years,
    baseInflation: state.baseInflation,
    edoYear1Rate: state.edoYear1Rate,
    edoMargin: state.edoMargin,
    customReturns: state.customReturns,
    marketMode: state.marketMode,
    seed: state.seed
  });
  lastMarketEnv = marketEnv;

  const baseConfig = {
    weights: state.weights,
    initialCapital: state.initialCapital,
    monthlyContribution: state.monthlyContribution,
    indexContributions: state.indexContributions,
    indexationMode: state.indexationMode,
    taxAccount: state.taxAccount,
    ikzeTaxBracket: state.ikzeTaxBracket,
    rebalanceMode: state.rebalanceMode
  };

  const userSim = simulatePortfolio(baseConfig, marketEnv);

  const standardTaxSim = state.taxAccount === 'standard'
    ? userSim
    : simulatePortfolio({ ...baseConfig, taxAccount: 'standard' }, marketEnv);

  const ikeSim = state.taxAccount === 'ike'
    ? userSim
    : simulatePortfolio({ ...baseConfig, taxAccount: 'ike' }, marketEnv);

  const nonIndexedSim = simulatePortfolio({ ...baseConfig, indexContributions: false }, marketEnv);

  const allStrategyResults = PRESET_STRATEGIES.map((preset) => {
    const weights = preset.id === 'custom' ? state.weights : preset.weights;
    const sim = simulatePortfolio({ ...baseConfig, weights }, marketEnv);
    return {
      ...preset,
      weights: { ...weights },
      sim
    };
  });

  const singleAssetStrategies = [
    { id: 'pure_sp500', name: '100% S&P 500 ETF', weights: { sp500: 100, nasdaq100: 0, msci_world: 0, msci_momentum: 0, msci_acwi: 0, edo: 0 } },
    { id: 'pure_nasdaq', name: '100% Nasdaq-100 ETF', weights: { sp500: 0, nasdaq100: 100, msci_world: 0, msci_momentum: 0, msci_acwi: 0, edo: 0 } },
    { id: 'pure_momentum', name: '100% MSCI World Momentum ETF', weights: { sp500: 0, nasdaq100: 0, msci_world: 0, msci_momentum: 100, msci_acwi: 0, edo: 0 } },
    { id: 'pure_world', name: '100% MSCI World ETF', weights: { sp500: 0, nasdaq100: 0, msci_world: 100, msci_momentum: 0, msci_acwi: 0, edo: 0 } },
    { id: 'pure_acwi', name: '100% MSCI ACWI ETF', weights: { sp500: 0, nasdaq100: 0, msci_world: 0, msci_momentum: 0, msci_acwi: 100, edo: 0 } },
    { id: 'pure_edo', name: '100% Obligacje EDO', weights: { sp500: 0, nasdaq100: 0, msci_world: 0, msci_momentum: 0, msci_acwi: 0, edo: 100 } }
  ].map((st) => ({
    ...st,
    sim: simulatePortfolio({ ...baseConfig, weights: st.weights }, marketEnv)
  }));

  // Pełna analiza empiryczna 2000–2026 dla wybranych wag portfela
  const empiricalRisk = analyzeHistoricalRiskAndDrawdowns(
    state.weights,
    state.edoMargin,
    Math.max(1, Math.round(state.years)),
    state.marketMode === 'historical_usd'
  );

  lastSimulationResult = {
    userSim,
    standardTaxSim,
    ikeSim,
    nonIndexedSim,
    allStrategyResults,
    singleAssetStrategies,
    empiricalRisk
  };

  updateKPIs();
  updateCharts();
  updateRiskAndDrawdownSection();
  updateComparisonTable();
  updateInflationSummaryBox();
}

function updateKPIs() {
  const { userSim, standardTaxSim, ikeSim } = lastSimulationResult;
  const s = userSim.summary;
  const isReal = state.valueDisplayMode === 'real';

  const finalNet = isReal ? s.realNetFinalValue : s.netFinalValue;
  const contributed = isReal ? s.contributedReal : s.contributedNominal;
  const netProfit = finalNet - contributed;
  const multiplier = contributed > 0 ? (finalNet / contributed).toFixed(2) : '1.00';

  document.getElementById('kpiNetValue').textContent = formatPLN(finalNet);
  document.getElementById('kpiNetSub').innerHTML = isReal
    ? `Na koniec (${s.endYM}) | Nominalnie: <strong>${formatPLN(s.netFinalValue)}</strong>`
    : `Na koniec (${s.endYM}) | Siła nabywcza (${s.startYM}): <strong>${formatPLN(s.realNetFinalValue)}</strong>`;

  document.getElementById('kpiContributed').textContent = formatPLN(contributed);
  document.getElementById('kpiContributedSub').innerHTML = state.indexContributions
    ? `Wpłata ${s.startYM}: <strong>${formatPLN(s.initialMonthlyContribution)}</strong> → ${s.endYM}: <strong>${formatPLN(s.finalMonthlyContribution)}</strong>`
    : `Stała wpłata (${s.startYM} → ${s.endYM}): <strong>${formatPLN(s.initialMonthlyContribution)}/mies.</strong>`;

  document.getElementById('kpiProfit').textContent = formatPLN(netProfit);
  document.getElementById('kpiProfitSub').innerHTML = `Mnożnik: <span class="badge badge-success">${multiplier}x</span> | CAGR: <strong>${s.cagr.toFixed(2)}%</strong> | MaxDD: <strong class="text-rose">${s.maxDrawdown.toFixed(1)}%</strong>`;

  const taxCostDisplay = isReal ? (s.totalTaxCost / s.finalInflationFactor) : s.totalTaxCost;
  const ikeSaved = Math.max(0, ikeSim.summary.netFinalValue - standardTaxSim.summary.netFinalValue);

  const taxEl = document.getElementById('kpiTax');
  const taxSubEl = document.getElementById('kpiTaxSub');

  if (state.taxAccount === 'ike') {
    taxEl.textContent = '0 zł (IKE)';
    taxEl.className = 'kpi-value text-emerald';
    taxSubEl.innerHTML = `Zaoszczędzony podatek Belki: <strong class="text-emerald">+${formatPLN(ikeSaved)}</strong>`;
  } else if (state.taxAccount === 'ikze') {
    taxEl.textContent = formatPLN(taxCostDisplay);
    taxEl.className = 'kpi-value text-amber';
    taxSubEl.innerHTML = `10% ryczałt | Zwroty PIT reinwestowane: <strong class="text-emerald">+${formatPLN(s.ikzePitRefunds)}</strong>`;
  } else {
    taxEl.textContent = `-${formatPLN(taxCostDisplay)}`;
    taxEl.className = 'kpi-value text-rose';
    taxSubEl.innerHTML = `Podatek Belki 19% (Na IKE miałbyś o <strong class="text-emerald">${formatPLN(ikeSaved)}</strong> więcej)`;
  }
}

function updateInflationSummaryBox() {
  const box = document.getElementById('inflationImpactBanner');
  if (!box || !lastSimulationResult) return;

  const { userSim, nonIndexedSim } = lastSimulationResult;
  const sIdx = userSim.summary;
  const sNoIdx = nonIndexedSim.summary;
  const diffNet = sIdx.netFinalValue - sNoIdx.netFinalValue;

  if (state.indexContributions) {
    box.innerHTML = `
      <div>
        <strong>Okres inwestycji: ${sIdx.startYM} → ${sIdx.endYM} (${sIdx.totalMonths} mies.) | Waloryzacja wpłat o inflację AKTYWNA:</strong>
        Zaczynasz w <strong>${sIdx.startYM}</strong> od wpłaty <strong>${formatPLN(sIdx.initialMonthlyContribution)}/mies.</strong>
        W <strong>${sIdx.endYM}</strong> zwaloryzowana wpłata wynosi <strong>${formatPLN(sIdx.finalMonthlyContribution)}/mies.</strong>
        Dzięki waloryzacji wpłat Twój portfel końcowy netto jest wyższy o <strong class="text-emerald">+${formatPLN(diffNet)}</strong> niż przy niezmiennej kwocie przelewu!
      </div>
    `;
  } else {
    box.innerHTML = `
      <div>
        <strong>Okres inwestycji: ${sIdx.startYM} → ${sIdx.endYM} (${sIdx.totalMonths} mies.) | Waloryzacja wpłat WYŁĄCZONA:</strong>
        Wpłacasz stałe nominalne <strong>${formatPLN(sIdx.initialMonthlyContribution)}/mies.</strong> przez cały okres ${sIdx.startYM} → ${sIdx.endYM}.
        Przez inflację realna siła nabywcza Twojej miesięcznej wpłaty w ${sIdx.endYM} spadła do
        <strong class="text-amber">${formatPLN(sIdx.initialMonthlyContribution / sIdx.finalInflationFactor)}</strong> w pieniądzach z ${sIdx.startYM}.
      </div>
    `;
  }
}

function updateRiskAndDrawdownSection() {
  if (!lastSimulationResult) return;
  const { userSim, empiricalRisk } = lastSimulationResult;
  const s = userSim.summary;

  // 1. Prawdopodobieństwa obsunięć (w 1 roku vs w całym horyzoncie N lat)
  const probContainer = document.getElementById('drawdownProbabilitiesContainer');
  if (probContainer) {
    probContainer.innerHTML = `
      <div style="font-size:0.75rem;color:var(--text-secondary);margin-bottom:0.5rem;display:flex;justify-content:space-between;">
        <span>Głębokość spadku od szczytu</span>
        <span>Szansa w ciągu 1 roku | Szansa w okresie ${empiricalRisk.effectiveWindowYears} lat</span>
      </div>
      ${empiricalRisk.drawdownProbabilities.map((item) => {
        const pAnn = item.probAnnual.toFixed(1);
        const pHor = item.probHorizon.toFixed(1);
        const barColor = item.threshold >= 30 ? '#f43f5e' : item.threshold >= 15 ? '#f59e0b' : '#3b82f6';
        return `
          <div style="margin-bottom:0.55rem;background:var(--bg-input);padding:0.5rem 0.65rem;border-radius:8px;border:1px solid var(--border-color);">
            <div style="display:flex;justify-content:space-between;font-size:0.79rem;margin-bottom:0.25rem;">
              <strong>${item.label}</strong>
              <span>
                Rocznie: <strong style="color:${barColor}">${pAnn}%</strong>
                &nbsp;|&nbsp;
                W ${empiricalRisk.effectiveWindowYears} lat: <strong style="color:${barColor}">${pHor}%</strong>
              </span>
            </div>
            <div style="height:6px;background:#1e293b;border-radius:4px;overflow:hidden;display:flex;">
              <div style="width:${Math.min(100, item.probAnnual)}%;background:${barColor};height:100%;"></div>
            </div>
          </div>
        `;
      }).join('')}
    `;
  }

  // 2. Zaawansowane wskaźniki ryzyka w wybranym okresie symulacji
  const metricsGrid = document.getElementById('advancedRiskMetricsGrid');
  if (metricsGrid) {
    const cards = [
      {
        label: 'Max Drawdown (w symulacji)',
        val: `${s.maxDrawdown.toFixed(2)}%`,
        sub: `Szczyt: ${s.maxDrawdownPeakDate} → Dołek: ${s.maxDrawdownTroughDate}`,
        cls: 'text-rose',
        tipTitle: 'Max Drawdown (Maksymalne Obsunięcie Kapitału)',
        tipBody: 'Największy procentowy spadek wartości jednostki portfela (TWR) od historycznego szczytu do najniższego dołka w wybranym okresie symulacji.',
        tipHint: 'Przykład: -25% oznacza, że w najgorszym momencie kryzysu portfel warty na szczycie 100 000 zł przejściowo spadł do 75 000 zł.'
      },
      {
        label: 'Czas pod wodą (Underwater)',
        val: `${s.pctTimeUnderwater.toFixed(1)}% czasu`,
        sub: `Najdłużej bez nowego szczytu: ${s.maxUnderwaterMonths} mies.`,
        cls: 'text-amber',
        tipTitle: 'Czas pod wodą (Time Underwater)',
        tipBody: 'Jaki procent wszystkich miesięcy inwestycji portfel spędził poniżej swojego ostatniego rekordu wszech czasów (All-Time High) oraz ile miesięcy trwał najdłuższy okres czekania na odrobienie strat.',
        tipHint: 'Krótszy czas pod wodą oznacza szybsze wychodzenie z kryzysów.'
      },
      {
        label: 'Sharpe / Sortino / Calmar',
        val: `${s.sharpeRatio.toFixed(2)} / ${s.sortinoRatio.toFixed(2)}`,
        sub: `Calmar Ratio (CAGR/MaxDD): ${s.calmarRatio.toFixed(2)}`,
        cls: 'text-blue',
        tipTitle: 'Wskaźniki Efektywności: Sharpe, Sortino i Calmar',
        tipBody: '• <b>Sharpe Ratio</b>: zysk ponad stopę wolną od ryzyka podzielony przez całkowitą zmienność.<br>• <b>Sortino Ratio</b>: jak Sharpe, ale karze wyłącznie za zmienność spadkową (nie karze za gwałtowne wzrosty!).<br>• <b>Calmar Ratio</b>: średnioroczny zwrot (CAGR) podzielony przez maksymalne obsunięcie (MaxDD).',
        tipHint: 'Im wyższe wartości (np. Sharpe > 0.7, Sortino > 1.0, Calmar > 0.5), tym lepiej portfel wynagradza za podjęte ryzyko.'
      },
      {
        label: 'VaR 95% / CVaR 95% (Miesięczny)',
        val: `${s.var95Monthly.toFixed(2)}%`,
        sub: `Śr. strata w 5% najgorszych mies.: ${s.cvar95Monthly.toFixed(2)}%`,
        cls: 'text-rose',
        tipTitle: 'Value at Risk (VaR 95%) oraz Expected Shortfall (CVaR 95%)',
        tipBody: '• <b>VaR 95%</b>: próg, którego miesięczna strata NIE przekroczyła w 95% wszystkich miesięcy (czyli tylko raz na 20 miesięcy było gorzej).<br>• <b>CVaR 95% (Expected Shortfall)</b>: średnia strata w tych 5% absolutnie najgorszych, kryzysowych miesięcy.',
        tipHint: 'CVaR pokazuje czego spodziewać się podczas prawdziwego krachu rynkowego.'
      },
      {
        label: 'Najlepszy / Najgorszy miesiąc',
        val: `+${s.bestMonth.pct.toFixed(1)}% / ${s.worstMonth.pct.toFixed(1)}%`,
        sub: `Najlepszy: ${s.bestMonth.ym} | Najgorszy: ${s.worstMonth.ym}`,
        cls: 'text-emerald',
        tipTitle: 'Ekstrema Miesięczne (Best & Worst Month)',
        tipBody: 'Najwyższa oraz najniższa pojedyncza miesięczna stopa zwrotu Twojego portfela w badanym okresie wraz z dokładną datą (rok-miesiąc).',
        tipHint: 'Pokazuje jak szerokie potrafią być miesięczne wahania portfela.'
      },
      {
        label: 'Skuteczność miesięczna (Win Rate)',
        val: `${s.winRateMonths.toFixed(1)}%`,
        sub: `Roczna zmienność: ${s.volatility.toFixed(1)}% (Spadkowa: ${s.downsideDeviation.toFixed(1)}%)`,
        cls: 'text-emerald',
        tipTitle: 'Win Rate (% Miesięcy Wzrostowych) i Zmienność',
        tipBody: '• <b>Win Rate</b>: odsetek miesięcy, które zakończyły się na plusie.<br>• <b>Roczna zmienność</b>: odchylenie standardowe rocznych stóp zwrotu.<br>• <b>Zmienność spadkowa</b>: miara samych ujemnych odchyleń.',
        tipHint: 'Portfele z obligacjami EDO mają zazwyczaj znacznie wyższy Win Rate (często > 65–75% dodatnich miesięcy).'
      }
    ];

    metricsGrid.innerHTML = cards.map((c) => `
      <div style="background:var(--bg-input);border:1px solid var(--border-color);border-radius:8px;padding:0.6rem 0.75rem;">
        <div style="font-size:0.7rem;color:var(--text-secondary);text-transform:uppercase;display:flex;align-items:center;justify-content:space-between;">
          <span>${c.label}</span>
          <span class="info-tip" data-tip-title="${c.tipTitle}" data-tip-body="${c.tipBody}" data-tip-hint="${c.tipHint}">?</span>
        </div>
        <div class="${c.cls}" style="font-size:1.05rem;font-weight:800;margin:0.15rem 0;">${c.val}</div>
        <div style="font-size:0.7rem;color:var(--text-secondary);">${c.sub}</div>
      </div>
    `).join('');
  }

  // 3. Podsumowanie kroczących okien historycznych (Rolling Windows 2000-2026)
  const rwTitle = document.getElementById('rollingWindowsTitle');
  const rwBox = document.getElementById('rollingWindowsSummaryBox');
  if (rwTitle) {
    rwTitle.textContent = `🔄 Test wszystkich ${empiricalRisk.totalRollingWindows} historycznych okresów ${empiricalRisk.effectiveWindowYears}-letnich (1985–2026)`;
  }
  if (rwBox && empiricalRisk.bestWindow && empiricalRisk.worstWindow) {
    const bw = empiricalRisk.bestWindow;
    const mw = empiricalRisk.medianWindow;
    const ww = empiricalRisk.worstWindow;
    rwBox.innerHTML = `
      <div style="background:var(--bg-input);border:1px solid var(--border-color);border-radius:8px;padding:0.75rem;font-size:0.79rem;">
        <div style="display:flex;justify-content:space-between;margin-bottom:0.5rem;padding-bottom:0.4rem;border-bottom:1px solid rgba(255,255,255,0.07);">
          <span>Szansa na dodatnią stopę zwrotu po ${empiricalRisk.effectiveWindowYears} latach:</span>
          <strong class="text-emerald" style="font-size:0.9rem;">${empiricalRisk.positiveWindowProb.toFixed(1)}% (${empiricalRisk.totalRollingWindows} okresów)</strong>
        </div>
        <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:0.5rem;">
          <div style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.25);border-radius:6px;padding:0.5rem;">
            <div style="font-size:0.68rem;color:#34d399;font-weight:700;">NAJLEPSZY OKRES</div>
            <div style="font-weight:800;font-size:0.95rem;margin:2px 0;">+${bw.cagr.toFixed(2)}% / rok</div>
            <div style="font-size:0.68rem;color:var(--text-secondary);">${bw.startYM} → ${bw.endYM}</div>
            <div style="font-size:0.68rem;color:var(--text-secondary);">MaxDD: ${bw.maxDD.toFixed(1)}%</div>
          </div>
          <div style="background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.25);border-radius:6px;padding:0.5rem;">
            <div style="font-size:0.68rem;color:#60a5fa;font-weight:700;">MEDIANA (TYPOWY)</div>
            <div style="font-weight:800;font-size:0.95rem;margin:2px 0;">${mw.cagr >= 0 ? '+' : ''}${mw.cagr.toFixed(2)}% / rok</div>
            <div style="font-size:0.68rem;color:var(--text-secondary);">${mw.startYM} → ${mw.endYM}</div>
            <div style="font-size:0.68rem;color:var(--text-secondary);">MaxDD: ${mw.maxDD.toFixed(1)}%</div>
          </div>
          <div style="background:rgba(244,63,94,0.08);border:1px solid rgba(244,63,94,0.25);border-radius:6px;padding:0.5rem;">
            <div style="font-size:0.68rem;color:#fb7185;font-weight:700;">NAJGORSZY OKRES</div>
            <div style="font-weight:800;font-size:0.95rem;margin:2px 0;">${ww.cagr >= 0 ? '+' : ''}${ww.cagr.toFixed(2)}% / rok</div>
            <div style="font-size:0.68rem;color:var(--text-secondary);">${ww.startYM} → ${ww.endYM}</div>
            <div style="font-size:0.68rem;color:var(--text-secondary);">MaxDD: ${ww.maxDD.toFixed(1)}%</div>
          </div>
        </div>
      </div>
    `;
  }

  // 4. Tabela największych historycznych krachów dla tego portfela (2000-2026)
  const ddBody = document.getElementById('historicalDrawdownsTableBody');
  if (ddBody) {
    if (!empiricalRisk.topDrawdowns.length) {
      ddBody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-secondary);">Brak obsunięć przekraczających 3% (np. portfel 100% EDO)</td></tr>`;
    } else {
      ddBody.innerHTML = empiricalRisk.topDrawdowns.map((ep) => `
        <tr>
          <td><strong>${ep.peakYM}</strong> → ${ep.troughYM}</td>
          <td>${ep.recoveryYM}</td>
          <td class="text-rose"><strong>${ep.maxDepthPct.toFixed(2)}%</strong></td>
          <td>${ep.declineMonths} mies.</td>
          <td>${ep.underwaterMonths} mies.</td>
        </tr>
      `).join('');
    }
  }
}

function updateCharts() {
  if (!lastSimulationResult) return;

  const mainCanvas = document.getElementById('mainChartCanvas');
  const mainTooltip = document.getElementById('mainChartTooltip');
  const legendContainer = document.getElementById('mainChartLegend');
  const { userSim, allStrategyResults, singleAssetStrategies, empiricalRisk } = lastSimulationResult;
  const isReal = state.valueDisplayMode === 'real';

  const timeline = userSim.timeline;
  const labels = timeline.map((pt) => pt.label);

  if (state.activeMainChartTab === 'wealth') {
    const allBenchmarks = [...allStrategyResults, ...singleAssetStrategies];
    const bench = allBenchmarks.find((b) => b.id === state.compareBenchmarkId) || allStrategyResults[1];

    const series = [
      {
        name: `Twój Portfel Netto (${state.taxAccount.toUpperCase()})`,
        data: timeline.map((p) => isReal ? p.realNetValue : p.netValue),
        color: '#3b82f6',
        fill: true,
        width: 2.8
      },
      {
        name: 'Twój Portfel Brutto (przed podatkiem)',
        data: timeline.map((p) => isReal ? (p.grossValue / p.inflationFactor) : p.grossValue),
        color: '#10b981',
        fill: false,
        dashed: true,
        width: 2
      },
      {
        name: `Benchmark: ${bench.name} (Netto)`,
        data: bench.sim.timeline.map((p) => isReal ? p.realNetValue : p.netValue),
        color: '#f59e0b',
        fill: false,
        width: 2.1
      },
      {
        name: 'Suma Wpłaconego Kapitału',
        data: timeline.map((p) => isReal ? p.contributedReal : p.contributedNominal),
        color: '#64748b',
        fill: true,
        dashed: true,
        width: 1.8
      }
    ];

    renderLineChart(mainCanvas, mainTooltip, { labels, series });
    renderLegend(legendContainer, series);
  } else if (state.activeMainChartTab === 'compare_strategies') {
    const compareList = [
      { name: 'Twój Portfel', sim: userSim, color: '#3b82f6', width: 3.2 },
      { name: '100% MSCI World Momentum', sim: singleAssetStrategies.find(s => s.id === 'pure_momentum').sim, color: '#ec4899', width: 2.2 },
      { name: '100% S&P 500', sim: singleAssetStrategies.find(s => s.id === 'pure_sp500').sim, color: '#60a5fa', width: 2 },
      { name: '100% Nasdaq-100', sim: singleAssetStrategies.find(s => s.id === 'pure_nasdaq').sim, color: '#8b5cf6', width: 2 },
      { name: '100% MSCI ACWI', sim: singleAssetStrategies.find(s => s.id === 'pure_acwi').sim, color: '#f59e0b', width: 2 },
      { name: 'Klasyczny 60/40 (World+EDO)', sim: allStrategyResults.find(s => s.id === 'classic_60_40').sim, color: '#06b6d4', width: 2.2 },
      { name: '100% Obligacje EDO', sim: singleAssetStrategies.find(s => s.id === 'pure_edo').sim, color: '#10b981', width: 2.2 }
    ];

    const series = compareList.map((item) => ({
      name: item.name,
      data: item.sim.timeline.map((p) => isReal ? p.realNetValue : p.netValue),
      color: item.color,
      fill: item.name === 'Twój Portfel',
      width: item.width
    }));

    renderLineChart(mainCanvas, mainTooltip, { labels, series });
    renderLegend(legendContainer, series);
  } else if (state.activeMainChartTab === 'drawdown') {
    const allBenchmarks = [...allStrategyResults, ...singleAssetStrategies];
    const bench = allBenchmarks.find((b) => b.id === state.compareBenchmarkId) || allStrategyResults[1];
    const sp500Sim = singleAssetStrategies.find((s) => s.id === 'pure_sp500').sim;

    const series = [
      {
        name: 'Obsunięcie TWR: Twój Portfel (%)',
        data: timeline.map((p) => p.drawdown),
        color: '#3b82f6',
        fill: true,
        width: 2.5
      },
      {
        name: `Obsunięcie TWR: ${bench.name} (%)`,
        data: bench.sim.timeline.map((p) => p.drawdown),
        color: '#f59e0b',
        fill: false,
        width: 2
      },
      {
        name: 'Obsunięcie TWR: 100% S&P 500 (%)',
        data: sp500Sim.timeline.map((p) => p.drawdown),
        color: '#f43f5e',
        fill: false,
        dashed: true,
        width: 1.8
      }
    ];

    renderLineChart(mainCanvas, mainTooltip, {
      labels,
      series,
      yFormatter: (v) => `${v.toFixed(1)}%`,
      tooltipFormatter: (v) => `${v.toFixed(2)}%`
    });
    renderLegend(legendContainer, series);
  } else if (state.activeMainChartTab === 'yearly_bars') {
    const calYears = empiricalRisk.calendarYearReturns;
    renderBarChart(mainCanvas, mainTooltip, {
      labels: calYears.map((c) => c.year),
      values: calYears.map((c) => c.retPct),
      name: 'Rzeczywista roczna stopa zwrotu portfela'
    });
    legendContainer.innerHTML = `
      <div class="legend-item"><span class="legend-swatch" style="background:#10b981"></span><span>Rok wzrostowy (Najlepszy: ${empiricalRisk.bestCalendarYear.year} r. +${empiricalRisk.bestCalendarYear.retPct.toFixed(1)}%)</span></div>
      <div class="legend-item"><span class="legend-swatch" style="background:#f43f5e"></span><span>Rok spadkowy (Najgorszy: ${empiricalRisk.worstCalendarYear.year} r. ${empiricalRisk.worstCalendarYear.retPct.toFixed(1)}%)</span></div>
    `;
  } else if (state.activeMainChartTab === 'breakdown') {
    const layers = Object.values(ASSETS).map((asset) => ({
      id: asset.id,
      name: asset.name,
      color: asset.color,
      data: timeline.map((p) => {
        const raw = p.assetBreakdown[asset.id] || 0;
        return isReal ? (raw / p.inflationFactor) : raw;
      })
    }));

    renderStackedAreaChart(mainCanvas, mainTooltip, { labels, layers });
    renderLegend(legendContainer, layers);
  }

  const donutCanvas = document.getElementById('donutChartCanvas');
  if (donutCanvas) {
    const slices = Object.values(ASSETS).map((a) => ({
      label: a.name,
      value: state.weights[a.id] || 0,
      color: a.color
    }));
    const equityShare = 100 - (state.weights.edo || 0);
    renderDonutChart(donutCanvas, slices, `${equityShare}% / ${state.weights.edo || 0}%`, 'Akcje ETF / Obligacje EDO');
  }

  const contribCanvas = document.getElementById('contribChartCanvas');
  const contribTooltip = document.getElementById('contribChartTooltip');
  if (contribCanvas) {
    const series = [
      {
        name: 'Miesięczna wpłata nominalna (PLN)',
        data: timeline.map((p) => p.monthlyContributionActual),
        color: '#10b981',
        fill: true,
        width: 2.5
      },
      {
        name: `Siła nabywcza wpłaty (PLN z ${state.startYear} r.)`,
        data: timeline.map((p) => p.monthlyContributionActual / p.inflationFactor),
        color: '#3b82f6',
        fill: false,
        dashed: true,
        width: 2
      }
    ];
    renderLineChart(contribCanvas, contribTooltip, { labels, series });
  }
}

function renderLegend(container, items) {
  if (!container) return;
  container.innerHTML = items.map((item) => `
    <div class="legend-item">
      <span class="legend-swatch" style="background:${item.color}"></span>
      <span>${item.name}</span>
    </div>
  `).join('');
}

function updateComparisonTable() {
  const tbody = document.getElementById('comparisonTableBody');
  if (!tbody || !lastSimulationResult) return;

  const { userSim, allStrategyResults, singleAssetStrategies } = lastSimulationResult;
  const isReal = state.valueDisplayMode === 'real';

  const rowsData = [
    {
      name: '★ Twój Portfel (Wybrany)',
      isUser: true,
      weights: state.weights,
      sim: userSim
    },
    ...allStrategyResults.filter((s) => s.id !== 'custom'),
    ...singleAssetStrategies
  ];

  const seen = new Set();
  const uniqueRows = rowsData.filter((r) => {
    if (seen.has(r.name)) return false;
    seen.add(r.name);
    return true;
  });

  tbody.innerHTML = uniqueRows.map((row) => {
    const s = row.sim.summary;
    const gross = isReal ? (s.grossFinalValue / s.finalInflationFactor) : s.grossFinalValue;
    const net = isReal ? s.realNetFinalValue : s.netFinalValue;
    const tax = isReal ? (s.totalTaxCost / s.finalInflationFactor) : s.totalTaxCost;
    const profit = isReal ? s.realProfitNet : s.nominalProfitNet;
    const mult = isReal ? s.multiplierReal : s.multiplierNominal;

    const pills = Object.entries(row.weights)
      .filter(([, w]) => w > 0)
      .map(([k, w]) => `<span class="mini-pill" style="border-left:2px solid ${ASSETS[k].color}">${ASSETS[k].name.replace(' ETF', '')}: ${w}%</span>`)
      .join('');

    return `
      <tr class="${row.isUser ? 'highlight-row' : ''}">
        <td>
          <div>${row.name}</div>
          <div class="mini-alloc-pills">${pills}</div>
        </td>
        <td>${formatPLN(gross)}</td>
        <td class="text-rose">${tax > 0 ? `-${formatPLN(tax)}` : '0 zł'}</td>
        <td style="font-weight:700;color:#60a5fa;">${formatPLN(net)}</td>
        <td class="text-emerald">+${formatPLN(profit)} (${mult.toFixed(2)}x)</td>
        <td><strong>${s.cagr.toFixed(2)}%</strong></td>
        <td>${s.volatility.toFixed(1)}% <span style="color:var(--text-secondary);font-size:0.74rem;">(Sh: ${s.sharpeRatio.toFixed(2)})</span></td>
        <td class="${s.maxDrawdown < -15 ? 'text-rose' : 'text-amber'}">
          <strong>${s.maxDrawdown.toFixed(1)}%</strong>
          <div style="font-size:0.68rem;color:var(--text-secondary);">${s.maxDrawdownPeakDate} → ${s.maxDrawdownTroughDate}</div>
        </td>
      </tr>
    `;
  }).join('');
}

function exportSimulationToCSV() {
  if (!lastSimulationResult) return;
  const tl = lastSimulationResult.userSim.timeline;

  const headers = [
    'Miesiac_Lp',
    'Data_YYYY_MM',
    'Zwrot_Miesieczny_Pct',
    'Obsuniecie_TWR_Pct',
    'Wplata_Miesieczna_PLN',
    'Suma_Wplat_Nominalnie_PLN',
    'Wartosc_Brutto_PLN',
    'Podatek_Skumulowany_PLN',
    'Wartosc_Netto_PLN',
    'Wartosc_Realna_Netto_PLN',
    'SP500_PLN',
    'Nasdaq100_PLN',
    'MSCI_World_PLN',
    'MSCI_World_Momentum_PLN',
    'MSCI_ACWI_PLN',
    'Obligacje_EDO_PLN'
  ];

  const lines = [headers.join(';')];
  tl.forEach((p) => {
    lines.push([
      p.month,
      p.ym,
      p.monthlyReturnPct.toFixed(2),
      p.drawdown.toFixed(2),
      p.monthlyContributionActual.toFixed(2),
      p.contributedNominal.toFixed(2),
      p.grossValue.toFixed(2),
      p.totalTaxCost.toFixed(2),
      p.netValue.toFixed(2),
      p.realNetValue.toFixed(2),
      p.assetBreakdown.sp500.toFixed(2),
      p.assetBreakdown.nasdaq100.toFixed(2),
      p.assetBreakdown.msci_world.toFixed(2),
      p.assetBreakdown.msci_momentum.toFixed(2),
      p.assetBreakdown.msci_acwi.toFixed(2),
      p.assetBreakdown.edo.toFixed(2)
    ].join(';'));
  });

  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `symulacja_historyczna_${state.startYear}_${state.startYear + state.years}_${state.taxAccount}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

document.addEventListener('DOMContentLoaded', initApp);
