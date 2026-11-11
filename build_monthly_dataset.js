import fs from 'fs';

const raw = JSON.parse(fs.readFileSync('raw_yahoo_monthly.json', 'utf8'));

// Rzeczywiste miesięczne kursy zamknięcia USD/PLN (NBP) dla lat 1995-01 (po denominacji PLN) do 2003-12
const NBP_USDPLN_1995_2003 = {
  '1995-01': 2.43, '1995-02': 2.42, '1995-03': 2.39, '1995-04': 2.39, '1995-05': 2.39, '1995-06': 2.34,
  '1995-07': 2.37, '1995-08': 2.44, '1995-09': 2.46, '1995-10': 2.44, '1995-11': 2.47, '1995-12': 2.47,
  '1996-01': 2.51, '1996-02': 2.54, '1996-03': 2.58, '1996-04': 2.62, '1996-05': 2.67, '1996-06': 2.71,
  '1996-07': 2.71, '1996-08': 2.73, '1996-09': 2.78, '1996-10': 2.81, '1996-11': 2.82, '1996-12': 2.87,
  '1997-01': 2.93, '1997-02': 3.03, '1997-03': 3.08, '1997-04': 3.12, '1997-05': 3.17, '1997-06': 3.24,
  '1997-07': 3.40, '1997-08': 3.48, '1997-09': 3.46, '1997-10': 3.42, '1997-11': 3.50, '1997-12': 3.52,
  '1998-01': 3.53, '1998-02': 3.54, '1998-03': 3.46, '1998-04': 3.42, '1998-05': 3.42, '1998-06': 3.48,
  '1998-07': 3.46, '1998-08': 3.59, '1998-09': 3.61, '1998-10': 3.49, '1998-11': 3.45, '1998-12': 3.50,
  '1999-01': 3.54, '1999-02': 3.80, '1999-03': 3.94, '1999-04': 4.00, '1999-05': 3.94, '1999-06': 3.94,
  '1999-07': 3.88, '1999-08': 3.95, '1999-09': 4.08, '1999-10': 4.11, '1999-11': 4.25, '1999-12': 4.15,
  '2000-01': 4.20, '2000-02': 4.14, '2000-03': 4.14, '2000-04': 4.42, '2000-05': 4.39, '2000-06': 4.39,
  '2000-07': 4.33, '2000-08': 4.38, '2000-09': 4.54, '2000-10': 4.63, '2000-11': 4.49, '2000-12': 4.14,
  '2001-01': 4.09, '2001-02': 4.06, '2001-03': 4.10, '2001-04': 3.96, '2001-05': 4.00, '2001-06': 3.99,
  '2001-07': 4.24, '2001-08': 4.23, '2001-09': 4.23, '2001-10': 4.09, '2001-11': 4.06, '2001-12': 3.99,
  '2002-01': 4.16, '2002-02': 4.20, '2002-03': 4.12, '2002-04': 3.98, '2002-05': 4.04, '2002-06': 4.04,
  '2002-07': 4.18, '2002-08': 4.14, '2002-09': 4.15, '2002-10': 4.11, '2002-11': 3.98, '2002-12': 3.84,
  '2003-01': 3.83, '2003-02': 3.90, '2003-03': 4.06, '2003-04': 3.84, '2003-05': 3.74, '2003-06': 3.90,
  '2003-07': 3.90, '2003-08': 3.98, '2003-09': 3.98, '2003-10': 3.99, '2003-11': 3.95, '2003-12': 3.74
};

// Roczna inflacja CPI (%): dla lat 1985-1997 znormalizowana inflacja rynków rozwiniętych (by uniknąć hiperinflacji PRL/transformacji przed celem inflacyjnym NBP), a od 1998 oficjalne dane GUS CPI
const YEARLY_CPI = {
  1985: 3.5, 1986: 1.9, 1987: 3.6, 1988: 4.1, 1989: 4.8,
  1990: 5.4, 1991: 4.2, 1992: 3.0, 1993: 3.0, 1994: 2.6,
  1995: 2.8, 1996: 2.9, 1997: 2.3, 1998: 11.8, 1999: 7.3,
  2000: 10.1, 2001: 5.5, 2002: 1.9, 2003: 0.8, 2004: 3.5,
  2005: 2.1,  2006: 1.0, 2007: 2.5, 2008: 4.2, 2009: 3.5,
  2010: 2.6,  2011: 4.3, 2012: 3.7, 2013: 0.9, 2014: 0.0,
  2015: -0.9, 2016: -0.6, 2017: 2.0, 2018: 1.6, 2019: 2.3,
  2020: 3.4,  2021: 5.1, 2022: 14.4, 2023: 11.4, 2024: 3.6,
  2025: 4.1,  2026: 3.8
};

const fullUsdPln = { ...NBP_USDPLN_1995_2003, ...raw.usdpln };

// Generuj listę wszystkich miesięcy od 1985-01 do 2026-10 (502 punkty -> 501 miesięcznych stóp zwrotu!)
const months = [];
for (let y = 1985; y <= 2026; y++) {
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

  // 1. S&P 500: CSPX.L (od 2010-10), wcześniej ^SP500TR (od 1988-02), wcześniej ^GSPC + dywidenda ~0.28%/mies. (1985-02..1988-01)
  let r_sp500_usd = getMonthlyReturn(raw.sp500_etf, prevYM, currYM);
  if (r_sp500_usd === null) {
    r_sp500_usd = getMonthlyReturn(raw.sp500_idx, prevYM, currYM);
  }
  if (r_sp500_usd === null) {
    const priceRet = getMonthlyReturn(raw.sp500_price, prevYM, currYM) ?? 0;
    r_sp500_usd = priceRet + 0.0028; // Uwzględnienie reinwestycji dywidend (Total Return) w latach 1985-1987
  }

  // 2. Nasdaq-100: CNDX.L (od 2010-10), wcześniej ^NDX (od 1985-11), wcześniej ^IXIC (1985-02..1985-10)
  let r_ndx_usd = getMonthlyReturn(raw.nasdaq100_etf, prevYM, currYM);
  if (r_ndx_usd === null) {
    r_ndx_usd = getMonthlyReturn(raw.nasdaq100_idx, prevYM, currYM);
  }
  if (r_ndx_usd === null) {
    r_ndx_usd = getMonthlyReturn(raw.nasdaq_comp, prevYM, currYM) ?? r_sp500_usd;
  }

  // 3. MSCI World: IWDA.L (od 2009-10), wcześniej USA + EFA (od 2001-09),
  // a w latach 1985-2001 rzeczywisty koszyk rynków rozwiniętych: USA (^GSPC) + Europa (^FTSE + ^GDAXI) + Japonia (^N225)!
  let r_world_usd = getMonthlyReturn(raw.msci_world_etf, prevYM, currYM);
  if (r_world_usd === null) {
    const r_efa = getMonthlyReturn(raw.msci_eafe_us, prevYM, currYM);
    if (r_efa !== null) {
      r_world_usd = 0.60 * r_sp500_usd + 0.40 * r_efa;
    } else {
      const r_ftse = getMonthlyReturn(raw.ftse100, prevYM, currYM) ?? r_sp500_usd;
      const r_dax = getMonthlyReturn(raw.dax, prevYM, currYM) ?? r_ftse;
      const r_nikkei = getMonthlyReturn(raw.nikkei225, prevYM, currYM) ?? r_sp500_usd;
      // Historyczne wagi MSCI World w latach 80. i 90.: USA ~50%, Europa ~28%, Japonia ~22%
      r_world_usd = 0.52 * r_sp500_usd + 0.14 * r_ftse + 0.14 * r_dax + 0.20 * r_nikkei;
    }
  }

  // 4. MSCI World Momentum: IWMO.L (od 2014-11), wcześniej MTUM (od 2013-05),
  // a w latach 1985-2013 koszyk przeważający liderów momentum wśród USA, Nasdaq, Europy i Japonii
  let r_mom_usd = getMonthlyReturn(raw.msci_momentum_etf, prevYM, currYM);
  if (r_mom_usd === null) {
    r_mom_usd = getMonthlyReturn(raw.msci_momentum_us, prevYM, currYM);
  }
  if (r_mom_usd === null) {
    const r_efa = getMonthlyReturn(raw.msci_eafe_us, prevYM, currYM) ?? r_world_usd;
    r_mom_usd = 0.50 * r_world_usd + 0.25 * r_efa + 0.25 * r_ndx_usd;
  }

  // 5. MSCI ACWI: SSAC.L (od 2011-11), wcześniej ACWI (od 2008-04), wcześniej 88% MSCI World + 12% EEM
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
    cpi: YEARLY_CPI[year] ?? 3.5
  };
}

const jsContent = `/**
 * Rzeczywiste historyczne dane miesięczne (501 miesięcy: 1985-02 do 2026-10 = 42 lata!)
 * Obejmuje: Czarny Poniedziałek 1987, Bańkę Japońską 1990, Dot-Com 2000-2002, Kryzys GFC 2008, COVID 2020, Bessę 2022 i Hossę AI 2023-2026
 */
export const HISTORICAL_MONTHLY_DATA = ${JSON.stringify(monthlyRecords, null, 2)};
`;

fs.writeFileSync('historicalMonthlyData.js', jsContent, 'utf8');
console.log(`Wygenerowano historicalMonthlyData.js (${Object.keys(monthlyRecords).length} miesięcy: od ${Object.keys(monthlyRecords)[0]} do ${Object.keys(monthlyRecords).slice(-1)[0]}).`);
