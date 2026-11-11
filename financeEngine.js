/**
 * Silnik finansowy Wizualizatora Portfela Inwestycyjnego oparty na RZECZYWISTYCH DANYCH MIESIĘCZNYCH (2000–2026)
 * Aktywa: S&P 500, Nasdaq-100, MSCI World, MSCI World Momentum, MSCI ACWI, Obligacje EDO + Podatek Belki / IKE / IKZE
 */

import { HISTORICAL_MONTHLY_DATA } from './historicalMonthlyData.js';

export const ASSETS = {
  sp500: {
    id: 'sp500',
    name: 'S&P 500 ETF',
    fullName: 'iShares Core S&P 500 UCITS ETF (Acc)',
    ticker: 'CSPX / VUAA',
    color: '#3b82f6',
    defaultReturn: 10.5,
    volatility: 15.8,
    ter: 0.07,
    beta: 1.0,
    type: 'equity',
    description: '500 największych spółek z USA. Rzeczywiste dane miesięczne (CSPX.L / ^SP500TR).'
  },
  nasdaq100: {
    id: 'nasdaq100',
    name: 'Nasdaq-100 ETF',
    fullName: 'iShares Nasdaq 100 UCITS ETF (Acc)',
    ticker: 'CNDX / EQQQ',
    color: '#8b5cf6',
    defaultReturn: 13.4,
    volatility: 21.5,
    ter: 0.20,
    beta: 1.28,
    type: 'equity',
    description: '100 największych spółek niefinansowych z giełdy Nasdaq. Rzeczywiste dane miesięczne (CNDX.L / ^NDX).'
  },
  msci_world: {
    id: 'msci_world',
    name: 'MSCI World ETF',
    fullName: 'iShares Core MSCI World UCITS ETF (Acc)',
    ticker: 'IWDA / EUNL',
    color: '#06b6d4',
    defaultReturn: 9.4,
    volatility: 14.4,
    ter: 0.12,
    beta: 0.92,
    type: 'equity',
    description: 'Ponad 1400 spółek z 23 krajów rozwiniętych. Rzeczywiste dane miesięczne (IWDA.L / MSCI World).'
  },
  msci_momentum: {
    id: 'msci_momentum',
    name: 'MSCI World Momentum ETF',
    fullName: 'iShares Edge MSCI World Momentum Factor UCITS ETF (Acc)',
    ticker: 'IWMO / IS3R',
    color: '#ec4899',
    defaultReturn: 11.8,
    volatility: 16.4,
    ter: 0.25,
    beta: 1.05,
    type: 'equity',
    description: 'Globalne spółki o najsilniejszym trendzie wzrostowym (faktor Momentum). Dane miesięczne (IWMO.L / MTUM).'
  },
  msci_acwi: {
    id: 'msci_acwi',
    name: 'MSCI ACWI ETF',
    fullName: 'iShares MSCI ACWI UCITS ETF (Acc)',
    ticker: 'SSAC / ISAC',
    color: '#f59e0b',
    defaultReturn: 8.9,
    volatility: 14.7,
    ter: 0.20,
    beta: 0.90,
    type: 'equity',
    description: 'Cały świat w jednym ETF: Rynki Rozwinięte (89%) + Wschodzące (11%). Dane miesięczne (SSAC.L / ACWI).'
  },
  edo: {
    id: 'edo',
    name: 'Obligacje EDO (10-letnie)',
    fullName: 'Detaliczne Obligacje Skarbowe EDO (Indeksowane Inflacją)',
    ticker: 'EDO (Skarb Państwa)',
    color: '#10b981',
    defaultReturn: null,
    volatility: 0.8,
    ter: 0.0,
    beta: 0.0,
    type: 'bonds_edo',
    description: '10-letnie obligacje skarbowe: 1. rok stałe oprocentowanie, lata 2–10: Inflacja GUS + marża z roczną kapitalizacją.'
  }
};

export const EQUITY_IDS = ['sp500', 'nasdaq100', 'msci_world', 'msci_momentum', 'msci_acwi'];
export const ALL_HISTORICAL_MONTH_KEYS = Object.keys(HISTORICAL_MONTHLY_DATA).sort();

export const PRESET_STRATEGIES = [
  {
    id: 'custom',
    name: 'Portfel Własny',
    desc: 'Dowolne proporcje wybrane suwakami',
    weights: { sp500: 30, nasdaq100: 15, msci_world: 0, msci_momentum: 15, msci_acwi: 10, edo: 30 }
  },
  {
    id: 'core_momentum_edo',
    name: 'Core + Momentum + EDO',
    desc: '40% MSCI World, 30% World Momentum, 30% EDO',
    weights: { sp500: 0, nasdaq100: 0, msci_world: 40, msci_momentum: 30, msci_acwi: 0, edo: 30 }
  },
  {
    id: 'classic_60_40',
    name: 'Klasyczny 60/40 (Świat + EDO)',
    desc: '60% MSCI World, 40% Obligacje EDO',
    weights: { sp500: 0, nasdaq100: 0, msci_world: 60, msci_momentum: 0, msci_acwi: 0, edo: 40 }
  },
  {
    id: 'growth_80_20',
    name: 'Dynamiczny 80/20 (USA + EDO)',
    desc: '50% S&P 500, 15% Nasdaq, 15% Momentum, 20% EDO',
    weights: { sp500: 50, nasdaq100: 15, msci_world: 0, msci_momentum: 15, msci_acwi: 0, edo: 20 }
  },
  {
    id: 'all_momentum',
    name: '100% MSCI World Momentum',
    desc: '100% Faktor Momentum (IWMO) – liderzy trendu',
    weights: { sp500: 0, nasdaq100: 0, msci_world: 0, msci_momentum: 100, msci_acwi: 0, edo: 0 }
  },
  {
    id: 'all_acwi',
    name: '100% Globalny Pasywny (ACWI)',
    desc: '100% MSCI ACWI – maksymalna prostota',
    weights: { sp500: 0, nasdaq100: 0, msci_world: 0, msci_momentum: 0, msci_acwi: 100, edo: 0 }
  },
  {
    id: 'all_nasdaq',
    name: 'Agresywny Tech & Momentum',
    desc: '50% Nasdaq-100, 30% Momentum, 20% S&P 500',
    weights: { sp500: 20, nasdaq100: 50, msci_world: 0, msci_momentum: 30, msci_acwi: 0, edo: 0 }
  },
  {
    id: 'safe_edo_shield',
    name: 'Bezpieczna Tarcza 30/70',
    desc: '15% ACWI, 15% Momentum, 70% Obligacje EDO',
    weights: { sp500: 0, nasdaq100: 0, msci_world: 0, msci_momentum: 15, msci_acwi: 15, edo: 70 }
  }
];

function createSeededRandom(seed = 42) {
  let a = seed >>> 0;
  return function nextUniform() {
    let t = (a += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generuje środowisko rynkowe na podstawie rzeczywistych danych miesięcznych (2000-02..2026-10).
 * Dostępne tryby:
 * - 'historical': Dokładne historyczne miesiące od wybranego roku startu (a po 2026-10 kontynuacja blokami historycznymi 2000-2026!)
 * - 'historical_usd': Dokładne historyczne miesiące w czystym USD (bez wpływu kursu USD/PLN)
 * - 'bootstrap': Empiryczny Block Bootstrap (losowanie spójnych 12-miesięcznych bloków z prawdziwej historii 2000–2026)
 * - 'deterministic': Teoretyczny gładki CAGR (tylko dla porównania matematycznego)
 */
export function generateMarketEnvironment(params) {
  const {
    startYear = 2010,
    startMonth = 1,
    endYear = 2026,
    endMonth = 10,
    years,
    baseInflation = 3.5,
    edoYear1Rate = 6.55,
    edoMargin = 1.50,
    customReturns,
    marketMode = 'historical', // 'historical' | 'historical_usd' | 'bootstrap' | 'deterministic'
    seed = 1337
  } = params;

  const computedMonths = (endYear !== undefined && endMonth !== undefined)
    ? (endYear - startYear) * 12 + (endMonth - startMonth)
    : (years || 16) * 12;
  const totalMonths = Math.max(1, computedMonths);
  const startYM = `${startYear}-${String(startMonth).padStart(2, '0')}`;
  const endAbs = startYear * 12 + (startMonth - 1) + totalMonths;
  const actualEndYear = Math.floor(endAbs / 12);
  const actualEndMonth = (endAbs % 12) + 1;
  const endYM = `${actualEndYear}-${String(actualEndMonth).padStart(2, '0')}`;

  const rng = createSeededRandom(seed);

  const monthlyInflation = [];
  const monthlyDates = [];
  const monthlyAssetReturns = {};
  EQUITY_IDS.forEach((id) => {
    monthlyAssetReturns[id] = [];
  });

  // Przygotuj sekwencję kluczy historycznych dla Block Bootstrap (bloki 12-miesięczne z lat 2000-2025)
  const totalHistLen = ALL_HISTORICAL_MONTH_KEYS.length;
  let bootstrapCursor = 0;

  for (let m = 0; m < totalMonths; m++) {
    const absMonth = startYear * 12 + (startMonth - 1) + m + 1;
    const currentCalendarYear = Math.floor(absMonth / 12);
    const monthInYear = (absMonth % 12) + 1;
    const ymKey = `${currentCalendarYear}-${String(monthInYear).padStart(2, '0')}`;
    monthlyDates.push(ymKey);

    if (marketMode === 'deterministic') {
      monthlyInflation.push(baseInflation / 100);
      EQUITY_IDS.forEach((assetId) => {
        const asset = ASSETS[assetId];
        const annualNominal = (customReturns?.[assetId] ?? asset.defaultReturn) / 100;
        const netAnnual = annualNominal - (asset.ter / 100);
        const rMonth = Math.pow(1 + netAnnual, 1 / 12) - 1;
        monthlyAssetReturns[assetId].push(rMonth);
      });
      continue;
    }

    // Wybierz rekord z prawdziwych danych miesięcznych
    let sourceRecord = HISTORICAL_MONTHLY_DATA[ymKey];

    if (marketMode === 'bootstrap' || !sourceRecord) {
      // Jeśli wybrano tryb Bootstrap lub wyszliśmy poza 2026-10, losujemy spójne 12-miesięczne bloki z prawdziwej historii 2000-2026!
      if (m % 12 === 0 || bootstrapCursor >= totalHistLen) {
        bootstrapCursor = Math.floor(rng() * Math.max(1, totalHistLen - 12));
      }
      const sampledKey = ALL_HISTORICAL_MONTH_KEYS[bootstrapCursor];
      sourceRecord = HISTORICAL_MONTHLY_DATA[sampledKey];
      bootstrapCursor += 1;
    }

    const cpiVal = (sourceRecord && sourceRecord.cpi !== undefined) ? sourceRecord.cpi / 100 : baseInflation / 100;
    monthlyInflation.push(Math.max(-0.02, cpiVal));

    const useUsd = marketMode === 'historical_usd';
    EQUITY_IDS.forEach((assetId) => {
      const key = useUsd ? `${assetId}_usd` : assetId;
      const r = sourceRecord?.[key] ?? sourceRecord?.[assetId] ?? 0;
      monthlyAssetReturns[assetId].push(r);
    });
  }

  return {
    startYear,
    startMonth,
    endYear: actualEndYear,
    endMonth: actualEndMonth,
    startYM,
    endYM,
    totalMonths,
    monthlyDates,
    monthlyInflation,
    monthlyAssetReturns,
    edoYear1Rate: edoYear1Rate / 100,
    edoMargin: edoMargin / 100
  };
}

/**
 * Symuluje portfel miesiąc po miesiącu na prawdziwych danych miesięcznych.
 * Oblicza zarówno krzywą kapitałową (z wpłatami DCA), jak i jednostkowy indeks TWR (Time-Weighted Return NAV),
 * co pozwala na bezbłędne wyliczenie prawdziwych obsunięć (Max Drawdown), czasu pod wodą, VaR, CVaR, Sharpe i Sortino.
 */
export function simulatePortfolio(config, marketEnv) {
  const {
    weights,
    initialCapital = 10000,
    monthlyContribution = 1500,
    indexContributions = true,
    indexationMode = 'annual',
    taxAccount = 'standard',
    ikzeTaxBracket = 12,
    rebalanceMode = 'contributions'
  } = config;

  const {
    startYear = 2010,
    startMonth = 1,
    endYear = 2026,
    endMonth = 10,
    startYM = `${startYear}-${String(startMonth).padStart(2, '0')}`,
    endYM = `${endYear}-${String(endMonth).padStart(2, '0')}`,
    totalMonths,
    monthlyDates,
    monthlyInflation,
    monthlyAssetReturns,
    edoYear1Rate,
    edoMargin
  } = marketEnv;

  const BELKA_RATE = 0.19;
  const normalizedWeights = {};
  const weightSum = Object.values(weights).reduce((s, v) => s + Number(v || 0), 0) || 100;
  Object.keys(ASSETS).forEach((k) => {
    normalizedWeights[k] = Number(weights[k] || 0) / weightSum;
  });

  const equityHoldings = {};
  EQUITY_IDS.forEach((id) => {
    equityHoldings[id] = { value: 0, costBasis: 0 };
  });

  let edoTranches = [];
  let totalContributedNominal = 0;
  let totalContributedReal = 0;
  let cumulativeInflationFactor = 1.0;
  let lastAnnualInflationFactor = 1.0;
  let totalTaxPaidMidTerm = 0;
  let totalIkzePitRefunds = 0;
  let currentYearContributions = 0;

  function allocateContribution(amount) {
    if (amount <= 0) return;

    if (rebalanceMode === 'contributions') {
      const currentEquityVal = Object.values(equityHoldings).reduce((s, h) => s + h.value, 0);
      const currentEdoVal = edoTranches.reduce((s, t) => s + t.currentValue, 0);
      const totalAfter = currentEquityVal + currentEdoVal + amount;

      const deficits = {};
      let totalDeficit = 0;

      EQUITY_IDS.forEach((id) => {
        const targetVal = totalAfter * normalizedWeights[id];
        const def = Math.max(0, targetVal - equityHoldings[id].value);
        deficits[id] = def;
        totalDeficit += def;
      });

      const targetEdo = totalAfter * normalizedWeights.edo;
      const edoDef = Math.max(0, targetEdo - currentEdoVal);
      deficits.edo = edoDef;
      totalDeficit += edoDef;

      if (totalDeficit > 0) {
        EQUITY_IDS.forEach((id) => {
          const buy = amount * (deficits[id] / totalDeficit);
          equityHoldings[id].value += buy;
          equityHoldings[id].costBasis += buy;
        });
        const buyEdo = amount * (deficits.edo / totalDeficit);
        if (buyEdo > 0.01) {
          edoTranches.push({
            principal: buyEdo,
            currentValue: buyEdo,
            lastCapValue: buyEdo,
            ageMonths: 0
          });
        }
        return;
      }
    }

    EQUITY_IDS.forEach((id) => {
      const buy = amount * normalizedWeights[id];
      equityHoldings[id].value += buy;
      equityHoldings[id].costBasis += buy;
    });

    const buyEdo = amount * normalizedWeights.edo;
    if (buyEdo > 0.01) {
      edoTranches.push({
        principal: buyEdo,
        currentValue: buyEdo,
        lastCapValue: buyEdo,
        ageMonths: 0
      });
    }
  }

  if (initialCapital > 0) {
    allocateContribution(initialCapital);
    totalContributedNominal += initialCapital;
    totalContributedReal += initialCapital;
    currentYearContributions += initialCapital;
  }

  const timeline = [];
  // Śledzenie jednostki portfela TWR (Time-Weighted Return NAV = 100 na starcie) oraz szczytu kapitałowego
  let unitNav = 100.0;
  let unitPeak = 100.0;
  let unitPeakDate = startYM;
  let maxUnitDrawdown = 0;
  let maxDrawdownPeakDate = startYM;
  let maxDrawdownTroughDate = startYM;

  let capitalPeakAdjusted = initialCapital;
  let maxCapitalDrawdown = 0;
  let monthsUnderwater = 0;
  let currentUnderwaterStreak = 0;
  let maxUnderwaterMonths = 0;

  const portfolioMonthlyReturns = [];

  const getBreakdownSnapshot = () => {
    const snap = { edo: edoTranches.reduce((s, t) => s + t.currentValue, 0) };
    EQUITY_IDS.forEach((id) => {
      snap[id] = equityHoldings[id].value;
    });
    return snap;
  };

  timeline.push({
    month: 0,
    year: 0,
    calendarYear: startYear,
    ym: startYM,
    label: startYM,
    contributedNominal: initialCapital,
    contributedReal: initialCapital,
    monthlyContributionActual: monthlyContribution,
    grossValue: initialCapital,
    netValue: initialCapital,
    realNetValue: initialCapital,
    totalTaxCost: 0,
    drawdown: 0,
    capitalDrawdown: 0,
    unitNav: 100,
    monthlyReturnPct: 0,
    inflationFactor: 1.0,
    assetBreakdown: getBreakdownSnapshot()
  });

  for (let m = 0; m < totalMonths; m++) {
    const monthNumber = m + 1;
    const calendarYear = startYear + Math.floor(m / 12);
    const ym = monthlyDates?.[m] || `${calendarYear}-${String((m % 12) + 1).padStart(2, '0')}`;
    const annualInf = monthlyInflation[m];
    const monthlyInfRate = Math.pow(1 + annualInf, 1 / 12) - 1;

    let currentMonthlyContribution = monthlyContribution;
    if (indexContributions) {
      currentMonthlyContribution = (indexationMode === 'monthly')
        ? monthlyContribution * cumulativeInflationFactor
        : monthlyContribution * lastAnnualInflationFactor;
    }

    allocateContribution(currentMonthlyContribution);
    totalContributedNominal += currentMonthlyContribution;
    totalContributedReal += currentMonthlyContribution / cumulativeInflationFactor;
    currentYearContributions += currentMonthlyContribution;

    // Powiększ poprzedni szczyt kapitałowy o bieżącą wpłatę (by wpłata nie maskowała spadku rynkowego!)
    capitalPeakAdjusted += currentMonthlyContribution;

    const portfolioBeforeGrowth =
      Object.values(equityHoldings).reduce((s, h) => s + h.value, 0) +
      edoTranches.reduce((s, t) => s + t.currentValue, 0);

    EQUITY_IDS.forEach((id) => {
      const r = monthlyAssetReturns[id][m];
      equityHoldings[id].value *= (1 + r);
    });

    const nextEdoTranches = [];
    let rolledOverEdoNet = 0;

    for (let i = 0; i < edoTranches.length; i++) {
      const tr = edoTranches[i];
      tr.ageMonths += 1;

      const annualRateForTranche = (tr.ageMonths <= 12)
        ? edoYear1Rate
        : Math.max(0, annualInf) + edoMargin;

      const monthlyRateForTranche = Math.pow(1 + annualRateForTranche, 1 / 12) - 1;
      tr.currentValue *= (1 + monthlyRateForTranche);

      if (tr.ageMonths % 12 === 0) {
        tr.lastCapValue = tr.currentValue;
      }

      if (tr.ageMonths >= 120) {
        const profit = Math.max(0, tr.currentValue - tr.principal);
        let taxOnMaturation = 0;
        if (taxAccount === 'standard') {
          taxOnMaturation = profit * BELKA_RATE;
          totalTaxPaidMidTerm += taxOnMaturation;
        }
        rolledOverEdoNet += (tr.currentValue - taxOnMaturation);
      } else {
        nextEdoTranches.push(tr);
      }
    }

    if (rolledOverEdoNet > 0) {
      nextEdoTranches.push({
        principal: rolledOverEdoNet,
        currentValue: rolledOverEdoNet,
        lastCapValue: rolledOverEdoNet,
        ageMonths: 0
      });
    }
    edoTranches = nextEdoTranches;

    const grossAfterGrowth =
      Object.values(equityHoldings).reduce((s, h) => s + h.value, 0) +
      edoTranches.reduce((s, t) => s + t.currentValue, 0);

    const mRet = portfolioBeforeGrowth > 0
      ? (grossAfterGrowth - portfolioBeforeGrowth) / portfolioBeforeGrowth
      : 0;
    portfolioMonthlyReturns.push({ ym, year: calendarYear, ret: mRet });

    // Aktualizacja TWR Unit NAV
    unitNav *= (1 + mRet);
    if (unitNav >= unitPeak) {
      unitPeak = unitNav;
      unitPeakDate = ym;
      currentUnderwaterStreak = 0;
    } else {
      monthsUnderwater += 1;
      currentUnderwaterStreak += 1;
      if (currentUnderwaterStreak > maxUnderwaterMonths) {
        maxUnderwaterMonths = currentUnderwaterStreak;
      }
    }

    const unitDd = unitPeak > 0 ? ((unitNav - unitPeak) / unitPeak) * 100 : 0;
    if (unitDd < maxUnitDrawdown) {
      maxUnitDrawdown = unitDd;
      maxDrawdownPeakDate = unitPeakDate;
      maxDrawdownTroughDate = ym;
    }

    cumulativeInflationFactor *= (1 + monthlyInfRate);
    if (monthNumber % 12 === 0) {
      lastAnnualInflationFactor = cumulativeInflationFactor;
    }

    if (monthNumber % 12 === 0) {
      if (taxAccount === 'ikze' && currentYearContributions > 0) {
        const pitRefund = currentYearContributions * (ikzeTaxBracket / 100);
        totalIkzePitRefunds += pitRefund;
        allocateContribution(pitRefund);
        capitalPeakAdjusted += pitRefund;
      }
      currentYearContributions = 0;

      if (rebalanceMode === 'annual_sell') {
        const eqVal = Object.values(equityHoldings).reduce((s, h) => s + h.value, 0);
        const edoVal = edoTranches.reduce((s, t) => s + t.currentValue, 0);
        let totalPortfolio = eqVal + edoVal;

        EQUITY_IDS.forEach((id) => {
          const targetVal = totalPortfolio * normalizedWeights[id];
          const currentVal = equityHoldings[id].value;
          if (currentVal > targetVal + 1) {
            const sellAmount = currentVal - targetVal;
            const sellFraction = sellAmount / currentVal;
            const costSold = equityHoldings[id].costBasis * sellFraction;
            const realizedGain = Math.max(0, sellAmount - costSold);

            if (taxAccount === 'standard' && realizedGain > 0) {
              const tax = realizedGain * BELKA_RATE;
              totalTaxPaidMidTerm += tax;
              totalPortfolio -= tax;
            }
            equityHoldings[id].value -= sellAmount;
            equityHoldings[id].costBasis -= costSold;
          }
        });

        EQUITY_IDS.forEach((id) => {
          const targetVal = totalPortfolio * normalizedWeights[id];
          const currentVal = equityHoldings[id].value;
          if (targetVal > currentVal + 1) {
            const buyAmount = targetVal - currentVal;
            equityHoldings[id].value += buyAmount;
            equityHoldings[id].costBasis += buyAmount;
          }
        });
      }
    }

    const grossEquity = Object.values(equityHoldings).reduce((s, h) => s + h.value, 0);
    const grossEdo = edoTranches.reduce((s, t) => s + t.currentValue, 0);
    const grossValue = grossEquity + grossEdo;

    let liquidationTax = 0;
    if (taxAccount === 'standard') {
      EQUITY_IDS.forEach((id) => {
        const gain = Math.max(0, equityHoldings[id].value - equityHoldings[id].costBasis);
        liquidationTax += gain * BELKA_RATE;
      });
      edoTranches.forEach((tr) => {
        const gain = Math.max(0, tr.currentValue - tr.principal);
        liquidationTax += gain * BELKA_RATE;
      });
    } else if (taxAccount === 'ikze') {
      liquidationTax = grossValue * 0.10;
    }

    const netValue = grossValue - liquidationTax;
    const realNetValue = netValue / cumulativeInflationFactor;

    if (netValue >= capitalPeakAdjusted) {
      capitalPeakAdjusted = netValue;
    }
    const capDd = capitalPeakAdjusted > 0 ? ((netValue - capitalPeakAdjusted) / capitalPeakAdjusted) * 100 : 0;
    if (capDd < maxCapitalDrawdown) {
      maxCapitalDrawdown = capDd;
    }

    timeline.push({
      month: monthNumber,
      year: +(monthNumber / 12).toFixed(2),
      calendarYear,
      ym,
      label: ym,
      contributedNominal: totalContributedNominal,
      contributedReal: totalContributedReal,
      monthlyContributionActual: currentMonthlyContribution,
      grossValue: grossValue + totalTaxPaidMidTerm,
      portfolioGrossCurrent: grossValue,
      netValue,
      realNetValue,
      liquidationTax,
      totalTaxCost: totalTaxPaidMidTerm + liquidationTax,
      ikzePitRefunds: totalIkzePitRefunds,
      drawdown: unitDd,          // Rynkowe obsunięcie jednostki portfela (TWR %)
      capitalDrawdown: capDd,    // Obsunięcie kapitału z uwzględnieniem wpłat (%)
      unitNav,
      monthlyReturnPct: mRet * 100,
      inflationFactor: cumulativeInflationFactor,
      assetBreakdown: getBreakdownSnapshot()
    });
  }

  const finalPoint = timeline[timeline.length - 1];
  const years = totalMonths / 12;

  // Geometryczny CAGR jednostki portfela (TWR)
  const geometricCagr = years > 0 ? (Math.pow(unitNav / 100, 1 / years) - 1) * 100 : 0;

  const rets = portfolioMonthlyReturns.map((x) => x.ret);
  const meanMonthlyReturn = rets.length > 0 ? rets.reduce((a, b) => a + b, 0) / rets.length : 0;

  const variance = rets.length > 1
    ? rets.reduce((acc, r) => acc + Math.pow(r - meanMonthlyReturn, 2), 0) / (rets.length - 1)
    : 0;
  const annualizedVolatility = Math.sqrt(variance * 12) * 100;

  // Zmienność spadkowa (Downside Deviation dla Sortino Ratio)
  const downSquares = rets.map((r) => (r < 0 ? r * r : 0));
  const downsideMonthly = downSquares.length > 0
    ? Math.sqrt(downSquares.reduce((a, b) => a + b, 0) / downSquares.length)
    : 0;
  const downsideDeviation = downsideMonthly * Math.sqrt(12) * 100;

  const riskFreeAnnual = 3.5; // stopa wolna od ryzyka odniesienia (%)
  const sharpeRatio = annualizedVolatility > 0.01 ? (geometricCagr - riskFreeAnnual) / annualizedVolatility : 0;
  const sortinoRatio = downsideDeviation > 0.01 ? (geometricCagr - riskFreeAnnual) / downsideDeviation : 0;
  const calmarRatio = Math.abs(maxUnitDrawdown) > 0.01 ? geometricCagr / Math.abs(maxUnitDrawdown) : 0;

  // Najlepszy i najgorszy miesiąc, VaR 95%, CVaR 95%, Win Rate
  const sortedByRet = [...portfolioMonthlyReturns].sort((a, b) => a.ret - b.ret);
  const worstMonth = sortedByRet[0] || { ym: '-', ret: 0 };
  const bestMonth = sortedByRet[sortedByRet.length - 1] || { ym: '-', ret: 0 };
  const positiveMonths = rets.filter((r) => r > 0).length;
  const winRateMonths = rets.length > 0 ? (positiveMonths / rets.length) * 100 : 0;

  const varIdx = Math.max(0, Math.floor(sortedByRet.length * 0.05));
  const var95Monthly = (sortedByRet[varIdx]?.ret || 0) * 100;
  const tailSlice = sortedByRet.slice(0, Math.max(1, varIdx + 1));
  const cvar95Monthly = (tailSlice.reduce((s, x) => s + x.ret, 0) / tailSlice.length) * 100;

  const nominalProfitNet = finalPoint.netValue - finalPoint.contributedNominal;
  const realProfitNet = finalPoint.realNetValue - finalPoint.contributedReal;

  return {
    timeline,
    summary: {
      startYear,
      startMonth,
      endYear,
      endMonth,
      startYM,
      endYM,
      totalMonths,
      years: +(totalMonths / 12).toFixed(2),
      contributedNominal: finalPoint.contributedNominal,
      contributedReal: finalPoint.contributedReal,
      initialMonthlyContribution: monthlyContribution,
      finalMonthlyContribution: finalPoint.monthlyContributionActual,
      grossFinalValue: finalPoint.grossValue,
      netFinalValue: finalPoint.netValue,
      realNetFinalValue: finalPoint.realNetValue,
      nominalProfitNet,
      realProfitNet,
      totalTaxCost: finalPoint.totalTaxCost,
      ikzePitRefunds: finalPoint.ikzePitRefunds,
      cagr: geometricCagr,
      volatility: annualizedVolatility,
      downsideDeviation,
      sharpeRatio,
      sortinoRatio,
      calmarRatio,
      maxDrawdown: maxUnitDrawdown,
      maxCapitalDrawdown,
      maxDrawdownPeakDate,
      maxDrawdownTroughDate,
      maxUnderwaterMonths,
      pctTimeUnderwater: totalMonths > 0 ? (monthsUnderwater / totalMonths) * 100 : 0,
      worstMonth: { ym: worstMonth.ym, pct: worstMonth.ret * 100 },
      bestMonth: { ym: bestMonth.ym, pct: bestMonth.ret * 100 },
      winRateMonths,
      var95Monthly,
      cvar95Monthly,
      finalInflationFactor: finalPoint.inflationFactor,
      multiplierNominal: finalPoint.contributedNominal > 0 ? finalPoint.netValue / finalPoint.contributedNominal : 1,
      multiplierReal: finalPoint.contributedReal > 0 ? finalPoint.realNetValue / finalPoint.contributedReal : 1
    }
  };
}

/**
 * Pełna Analiza Empiryczna (2000-02 do 2026-10 = 321 miesięcy prawdziwych danych rynkowych) dla wybranego składu portfela:
 * 1. Wykrywa wszystkie historyczne epizody obsunięć (Drawdown Episodes: szczyt, dołek, wyjście na szczyt, głębokość, czas trwania)
 * 2. Wylicza empiryczne prawdopodobieństwo (szansę) na obsunięcie >= 5%, >= 10%, >= 15%, >= 20%, >= 30%, >= 40%
 *    zarówno w pojedynczym roku (12 mies.), jak i w całym horyzoncie inwestycyjnym użytkownika (Rolling Windows)
 * 3. Przeprowadza test kroczących okien historycznych (Rolling Windows) i znajduje najlepszy, medianowy oraz najgorszy moment wejścia w historii.
 */
export function analyzeHistoricalRiskAndDrawdowns(weights, edoMargin = 1.5, horizonYears = 10, useUsd = false) {
  const weightSum = Object.values(weights).reduce((s, v) => s + Number(v || 0), 0) || 100;
  const normW = {};
  Object.keys(ASSETS).forEach((k) => {
    normW[k] = Number(weights[k] || 0) / weightSum;
  });

  // 1. Zbuduj pełny 501-miesięczny szereg zwrotów wybranego portfela (1985-02..2026-10)
  const monthlySeries = [];
  let nav = 100.0;
  let peak = 100.0;
  let peakYM = '1985-01';

  // Lista epizodów obsunięć
  const episodes = [];
  let currentEp = null;

  ALL_HISTORICAL_MONTH_KEYS.forEach((ym) => {
    const rec = HISTORICAL_MONTHLY_DATA[ym];
    let portRet = 0;

    EQUITY_IDS.forEach((id) => {
      const k = useUsd ? `${id}_usd` : id;
      const r = rec[k] ?? rec[id] ?? 0;
      portRet += normW[id] * r;
    });

    // Część obligacyjna EDO w danym miesiącu: rocznie Inflacja + marża
    const edoAnnual = Math.max(0.02, (rec.cpi / 100) + (edoMargin / 100));
    const edoMonthly = Math.pow(1 + edoAnnual, 1 / 12) - 1;
    portRet += normW.edo * edoMonthly;

    nav *= (1 + portRet);

    if (nav >= peak) {
      if (currentEp && currentEp.maxDepthPct <= -3.0) {
        currentEp.recoveryYM = ym;
        episodes.push(currentEp);
      }
      currentEp = null;
      peak = nav;
      peakYM = ym;
    } else {
      const ddPct = ((nav - peak) / peak) * 100;
      if (!currentEp) {
        currentEp = {
          peakYM,
          troughYM: ym,
          recoveryYM: 'Trwa nadal',
          maxDepthPct: ddPct,
          declineMonths: 1,
          underwaterMonths: 1
        };
      } else {
        currentEp.underwaterMonths += 1;
        if (ddPct < currentEp.maxDepthPct) {
          currentEp.maxDepthPct = ddPct;
          currentEp.troughYM = ym;
          currentEp.declineMonths = currentEp.underwaterMonths;
        }
      }
    }

    const ddNow = ((nav - peak) / peak) * 100;
    monthlySeries.push({ ym, ret: portRet, nav, ddPct: ddNow });
  });

  if (currentEp && currentEp.maxDepthPct <= -3.0) {
    episodes.push(currentEp);
  }

  // Posortuj największe obsunięcia w historii 2000-2026 od najgłębszego
  const topDrawdowns = [...episodes]
    .sort((a, b) => a.maxDepthPct - b.maxDepthPct)
    .slice(0, 6);

  // 2. Szansa na obsunięcie w dowolnym oknie 12-miesięcznym (rocznym) na podstawie 310 kroczących okresów 12-miesięcznych
  const rolling12MaxDDs = [];
  for (let i = 0; i <= monthlySeries.length - 12; i++) {
    let localNav = 100;
    let localPeak = 100;
    let worstDD = 0;
    for (let j = i; j < i + 12; j++) {
      localNav *= (1 + monthlySeries[j].ret);
      if (localNav > localPeak) localPeak = localNav;
      const dd = ((localNav - localPeak) / localPeak) * 100;
      if (dd < worstDD) worstDD = dd;
    }
    rolling12MaxDDs.push(worstDD);
  }

  const calcProb = (arr, threshold) => {
    if (!arr.length) return 0;
    const hits = arr.filter((dd) => dd <= -Math.abs(threshold)).length;
    return (hits / arr.length) * 100;
  };

  const annualDrawdownProbabilities = [
    { threshold: 5, label: 'Korekta ≥ 5%', probAnnual: calcProb(rolling12MaxDDs, 5) },
    { threshold: 10, label: 'Korekta ≥ 10%', probAnnual: calcProb(rolling12MaxDDs, 10) },
    { threshold: 15, label: 'Spadek ≥ 15%', probAnnual: calcProb(rolling12MaxDDs, 15) },
    { threshold: 20, label: 'Bessa ≥ 20%', probAnnual: calcProb(rolling12MaxDDs, 20) },
    { threshold: 30, label: 'Krach ≥ 30%', probAnnual: calcProb(rolling12MaxDDs, 30) },
    { threshold: 40, label: 'Głęboki krach ≥ 40%', probAnnual: calcProb(rolling12MaxDDs, 40) }
  ];

  // 3. Analiza kroczących okien historycznych (Rolling Windows) o długości wybranej przez użytkownika (do maks. 25 lat na 42-letniej próbie 1985-2026)
  const effectiveWindowYears = Math.max(1, Math.min(25, horizonYears));
  const windowMonths = effectiveWindowYears * 12;
  const rollingWindows = [];

  for (let i = 0; i <= monthlySeries.length - windowMonths; i++) {
    let wNav = 100;
    let wPeak = 100;
    let wWorstDD = 0;
    for (let j = i; j < i + windowMonths; j++) {
      wNav *= (1 + monthlySeries[j].ret);
      if (wNav > wPeak) wPeak = wNav;
      const dd = ((wNav - wPeak) / wPeak) * 100;
      if (dd < wWorstDD) wWorstDD = dd;
    }
    const cagr = (Math.pow(wNav / 100, 1 / effectiveWindowYears) - 1) * 100;
    rollingWindows.push({
      startYM: monthlySeries[i].ym,
      endYM: monthlySeries[i + windowMonths - 1].ym,
      cagr,
      totalReturnPct: wNav - 100,
      maxDD: wWorstDD
    });
  }

  const horizonMaxDDs = rollingWindows.map((w) => w.maxDD);
  annualDrawdownProbabilities.forEach((item) => {
    item.probHorizon = calcProb(horizonMaxDDs, item.threshold);
  });

  const sortedWindowsByCagr = [...rollingWindows].sort((a, b) => a.cagr - b.cagr);
  const worstWindow = sortedWindowsByCagr[0] || null;
  const medianWindow = sortedWindowsByCagr[Math.floor(sortedWindowsByCagr.length / 2)] || null;
  const bestWindow = sortedWindowsByCagr[sortedWindowsByCagr.length - 1] || null;
  const positiveWindowsCount = rollingWindows.filter((w) => w.cagr > 0).length;
  const positiveWindowProb = rollingWindows.length > 0 ? (positiveWindowsCount / rollingWindows.length) * 100 : 100;

  // Roczne stopy zwrotu kalendarzowe (2000..2026)
  const calendarYearsMap = {};
  monthlySeries.forEach((m) => {
    const y = m.ym.slice(0, 4);
    if (!calendarYearsMap[y]) calendarYearsMap[y] = 1.0;
    calendarYearsMap[y] *= (1 + m.ret);
  });
  const calendarYearReturns = Object.entries(calendarYearsMap).map(([year, mult]) => ({
    year,
    retPct: (mult - 1) * 100
  }));
  const sortedCalYears = [...calendarYearReturns].sort((a, b) => a.retPct - b.retPct);

  return {
    totalHistoricalMonths: monthlySeries.length,
    effectiveWindowYears,
    totalRollingWindows: rollingWindows.length,
    topDrawdowns,
    drawdownProbabilities: annualDrawdownProbabilities,
    worstWindow,
    medianWindow,
    bestWindow,
    positiveWindowProb,
    worstCalendarYear: sortedCalYears[0] || { year: '-', retPct: 0 },
    bestCalendarYear: sortedCalYears[sortedCalYears.length - 1] || { year: '-', retPct: 0 },
    calendarYearReturns
  };
}
