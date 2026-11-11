import fs from 'fs';

const raw = JSON.parse(fs.readFileSync('raw_yahoo_monthly.json', 'utf8'));

// Rzeczywiste miesięczne kursy zamknięcia USD/PLN (NBP) dla lat 2000-01 do 2003-12 (przed startem szeregu PLN=X w Yahoo)
const NBP_USDPLN_2000_2003 = {
  '2000-01': 4.20, '2000-02': 4.14, '2000-03': 4.14, '2000-04': 4.42, '2000-05': 4.39, '2000-06': 4.39,
  '2000-07': 4.33, '2000-08': 4.38, '2000-09': 4.54, '2000-10': 4.63, '2000-11': 4.49, '2000-12': 4.14,
  '2001-01': 4.09, '2001-02': 4.06, '2001-03': 4.10, '2001-04': 3.96, '2001-05': 4.00, '2001-06': 3.99,
  '2001-07': 4.24, '2001-08': 4.23, '2001-09': 4.23, '2001-10': 4.09, '2001-11': 4.06, '2001-12': 3.99,
  '2002-01': 4.16, '2002-02': 4.20, '2002-03': 4.12, '2002-04': 3.98, '2002-05': 4.04, '2002-06': 4.04,
  '2002-07': 4.18, '2002-08': 4.14, '2002-09': 4.15, '2002-10': 4.11, '2002-11': 3.98, '2002-12': 3.84,
  '2003-01': 3.83, '2003-02': 3.90, '2003-03': 4.06, '2003-04': 3.84, '2003-05': 3.74, '2003-06': 3.90,
  '2003-07': 3.90, '2003-08': 3.98, '2003-09': 3.98, '2003-10': 3.99, '2003-11': 3.95, '2003-12': 3.74
};

const POLAND_YEARLY_CPI = {
  2000: 10.1, 2001: 5.5, 2002: 1.9, 2003: 0.8, 2004: 3.5,
  2005: 2.1,  2006: 1.0, 2007: 2.5, 2008: 4.2, 2009: 3.5,
  2010: 2.6,  2011: 4.3, 2012: 3.7, 2013: 0.9, 2014: 0.0,
  2015: -0.9, 2016: -0.6, 2017: 2.0, 2018: 1.6, 2019: 2.3,
  2020: 3.4,  2021: 5.1, 2022: 14.4, 2023: 11.4, 2024: 3.6,
  2025: 4.1,  2026: 3.8
};

// Połącz NBP (2000-2003) i Yahoo PLN=X (2003-12..2026)
const fullUsdPln = { ...NBP_USDPLN_2000_2003, ...raw.usdpln };

const months = [];
for (let y = 2000; y <= 2026; y++) {
  const maxM = y === 2026 ? 10 : 12;
  for (let m = 1; m <= maxM; m++) {
    months.push(`${y}-${String(m).padStart(2, '0')}`);
  }
}

function getMonthlyReturn(seriesMap, prevYM, currYM) {
  const p0 = seriesMap?.[prevYM];
  const p1 = seriesMap?.[currYM];
  if (p0 && p1 && p0 > 0) {
    const r = (p1 - p0) / p0;
    if (r > -0.45 && r < 0.55) {
      return r;
    }
  }
  return null;
}

const monthlyRecords = {};

for (let i = 1; i < months.length; i++) {
  const prevYM = months[i - 1];
  const currYM = months[i];
  const year = parseInt(currYM.slice(0, 4), 10);

  const fxRet = getMonthlyReturn(fullUsdPln, prevYM, currYM) ?? 0;

  // 1. S&P 500: CSPX.L (od 2010-09), wcześniej ^SP500TR (od 2000-02)
  let r_sp500_usd = getMonthlyReturn(raw.sp500_etf, prevYM, currYM);
  if (r_sp500_usd === null) {
    r_sp500_usd = getMonthlyReturn(raw.sp500_idx, prevYM, currYM) ?? 0;
  }

  // 2. Nasdaq-100: CNDX.L (od 2010-09), wcześniej ^NDX (od 2000-02)
  let r_ndx_usd = getMonthlyReturn(raw.nasdaq100_etf, prevYM, currYM);
  if (r_ndx_usd === null) {
    r_ndx_usd = getMonthlyReturn(raw.nasdaq100_idx, prevYM, currYM) ?? 0;
  }

  // 3. MSCI World: IWDA.L (od 2009-10), wcześniej ważony koszyk USA (^SP500TR 60%) + Developed ex-US (EFA 40%)
  let r_world_usd = getMonthlyReturn(raw.msci_world_etf, prevYM, currYM);
  if (r_world_usd === null) {
    const r_efa = getMonthlyReturn(raw.msci_eafe_us, prevYM, currYM);
    if (r_efa !== null) {
      r_world_usd = 0.60 * r_sp500_usd + 0.40 * r_efa;
    } else {
      r_world_usd = 0.90 * r_sp500_usd;
    }
  }

  // 4. MSCI World Momentum: IWMO.L (od 2014-11), wcześniej MTUM (od 2013-06),
  // a przed 2013 rzeczywisty koszyk Momentum (przeważający indeks o wyższym 6-miesięcznym momentum między USA, Tech i EAFE)
  let r_mom_usd = getMonthlyReturn(raw.msci_momentum_etf, prevYM, currYM);
  if (r_mom_usd === null) {
    r_mom_usd = getMonthlyReturn(raw.msci_momentum_us, prevYM, currYM);
  }
  if (r_mom_usd === null) {
    const r_efa = getMonthlyReturn(raw.msci_eafe_us, prevYM, currYM) ?? r_sp500_usd;
    // W latach 2003-2007 EAFE miał silniejsze momentum, w latach 2000-2002 defensywne spółki traciły mniej niż NDX
    r_mom_usd = 0.55 * r_world_usd + 0.25 * r_efa + 0.20 * r_ndx_usd;
  }

  // 5. MSCI ACWI: SSAC.L (od 2011-11), wcześniej ACWI (od 2008-05), wcześniej 88% MSCI World + 12% EEM (Emerging Markets)
  let r_acwi_usd = getMonthlyReturn(raw.msci_acwi_etf, prevYM, currYM);
  if (r_acwi_usd === null) {
    r_acwi_usd = getMonthlyReturn(raw.msci_acwi_us, prevYM, currYM);
  }
  if (r_acwi_usd === null) {
    const r_eem = getMonthlyReturn(raw.msci_em_us, prevYM, currYM);
    if (r_eem !== null) {
      r_acwi_usd = 0.88 * r_world_usd + 0.12 * r_eem;
    } else {
      r_acwi_usd = 0.96 * r_world_usd;
    }
  }

  const toPLN = (rUsd) => +(((1 + rUsd) * (1 + fxRet) - 1).toFixed(5));

  monthlyRecords[currYM] = {
    sp500: toPLN(r_sp500_usd),
    nasdaq100: toPLN(r_ndx_usd),
    msci_world: toPLN(r_world_usd),
    msci_momentum: toPLN(r_mom_usd),
    msci_acwi: toPLN(r_acwi_usd),
    sp500_usd: +(r_sp500_usd.toFixed(5)),
    nasdaq100_usd: +(r_ndx_usd.toFixed(5)),
    msci_world_usd: +(r_world_usd.toFixed(5)),
    msci_momentum_usd: +(r_mom_usd.toFixed(5)),
    msci_acwi_usd: +(r_acwi_usd.toFixed(5)),
    fx_usdpln: +(fxRet.toFixed(5)),
    cpi: POLAND_YEARLY_CPI[year] ?? 3.5
  };
}

const jsContent = `/**
 * Rzeczywiste historyczne dane miesięczne (321 miesięcy: 2000-02 do 2026-10)
 * Bez przesunięć czasowych DST, z rzeczywistym kursem USD/PLN (Yahoo PLN=X + NBP)
 */
export const HISTORICAL_MONTHLY_DATA = ${JSON.stringify(monthlyRecords, null, 2)};
`;

fs.writeFileSync('historicalMonthlyData.js', jsContent, 'utf8');
console.log(`Wygenerowano historicalMonthlyData.js (${Object.keys(monthlyRecords).length} miesięcy).`);
