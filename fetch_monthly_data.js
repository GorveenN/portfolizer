import fs from 'fs';

const TICKERS = {
  sp500_etf: 'CSPX.L',         // iShares Core S&P 500 UCITS ETF USD (Acc)
  sp500_idx: '^SP500TR',       // S&P 500 Total Return Index (od 2000-01)
  nasdaq100_etf: 'CNDX.L',     // iShares Nasdaq 100 UCITS ETF USD (Acc)
  nasdaq100_idx: '^NDX',       // Nasdaq-100 Index (od 2000-01)
  msci_world_etf: 'IWDA.L',    // iShares Core MSCI World UCITS ETF USD (Acc) (od 2009-10)
  msci_eafe_us: 'EFA',         // iShares MSCI EAFE ETF (Rynki rozwinięte poza USA od 2001-08)
  msci_momentum_etf: 'IWMO.L', // iShares Edge MSCI World Momentum Factor UCITS ETF USD (Acc) (od 2014-10)
  msci_momentum_us: 'MTUM',    // iShares MSCI USA Momentum Factor ETF (od 2013-05)
  msci_acwi_etf: 'SSAC.L',     // iShares MSCI ACWI UCITS ETF USD (Acc) (od 2011-10)
  msci_acwi_us: 'ACWI',        // iShares MSCI ACWI ETF (od 2008-04)
  msci_em_us: 'EEM',           // iShares MSCI Emerging Markets ETF (od 2003-04)
  usdpln: 'PLN=X'              // Kurs USD/PLN miesięczny
};

async function fetchYahooMonthly(symbol) {
  const period1 = 946684800; // 2000-01-01
  const period2 = Math.floor(Date.now() / 1000);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?period1=${period1}&period2=${period2}&interval=1mo&includeAdjustedClose=true`;

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    }
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${symbol}`);
  }
  const json = await res.json();
  const result = json.chart?.result?.[0];
  if (!result) throw new Error(`No result for ${symbol}`);

  const timestamps = result.timestamp || [];
  const adjClose = result.indicators?.adjclose?.[0]?.adjclose || result.indicators?.quote?.[0]?.close || [];

  const monthlyMap = {}; // 'YYYY-MM' -> close price
  for (let i = 0; i < timestamps.length; i++) {
    const price = adjClose[i];
    if (price == null || isNaN(price)) continue;
    // Dodajemy 36 godzin (129600 s) do znacznika początku miesiąca (który w czasie letnim BST/CEST wypada o 23:00 dnia poprzedniego w UTC),
    // dzięki czemu każdy punkt ląduje bezpiecznie w 2. dniu właściwego miesiąca kalendarzowego!
    const d = new Date((timestamps[i] + 129600) * 1000);
    const ym = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    monthlyMap[ym] = price;
  }
  return monthlyMap;
}

async function main() {
  const raw = {};
  for (const [key, symbol] of Object.entries(TICKERS)) {
    try {
      console.log(`Pobieranie ${key} (${symbol})...`);
      raw[key] = await fetchYahooMonthly(symbol);
      console.log(`  Pobrano ${Object.keys(raw[key]).length} miesięcy dla ${symbol}`);
    } catch (err) {
      console.error(`  Błąd dla ${symbol}:`, err.message);
      raw[key] = {};
    }
  }

  fs.writeFileSync('raw_yahoo_monthly.json', JSON.stringify(raw, null, 2), 'utf8');
  console.log('Zapisano raw_yahoo_monthly.json');
}

main();
