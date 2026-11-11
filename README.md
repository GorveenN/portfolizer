# 📈 Wizualizator Portfela Inwestycyjnego ETF & Obligacje EDO (2000–2026)

Interaktywny symulator i analityk portfela inwestycyjnego dla polskiego inwestora, oparty na **rzeczywistych miesięcznych danych historycznych (321 miesięcy: 2000–2026)** pobranych z Yahoo Finance oraz danych inflacyjnych GUS i kursach NBP.

## ✨ Główne funkcje

- **6 klas aktywów z dowolnym mieszaniem wag (0–100%)**:
  - **S&P 500 UCITS ETF (Acc)** (`CSPX.L` / `^SP500TR`)
  - **Nasdaq-100 UCITS ETF (Acc)** (`CNDX.L` / `^NDX`)
  - **MSCI World UCITS ETF (Acc)** (`IWDA.L`)
  - **MSCI World Momentum Factor UCITS ETF (Acc)** (`IWMO.L` / `MTUM`)
  - **MSCI ACWI UCITS ETF (Acc)** (`SSAC.L` / `ACWI`)
  - **Detaliczne Obligacje Skarbowe 10-letnie EDO** (1. rok stały, lata 2–10: Inflacja GUS + marża, z roczną kapitalizacją odsetek i 10-letnim cyklem rolowania)
- **Inwestowanie cykliczne (DCA) z waloryzacją o inflację**:
  - Wybór roku startu inwestycji oraz bazowej kwoty miesięcznej wpłaty.
  - Automatyczna waloryzacja miesięcznych wpłat o inflację (skokowo raz w roku lub płynnie co miesiąc) dla utrzymania stałej siły nabywczej pieniądza.
  - Widok w **Wartościach Nominalnych (PLN)** oraz **Wartościach Realnych (siła nabywcza na starcie)**.
- **Polskie podatki**:
  - **Konto Zwykłe (19% podatku Belki)** – uwzględnia podatek przy 10-letnim rolowaniu transz EDO oraz przy zamknięciu pozycji.
  - **Konto IKE (0% podatku)** – wylicza dokładną kwotę zaoszczędzoną dzięki tarczy podatkowej IKE.
  - **Konto IKZE** – uwzględnia coroczne zwroty podatku PIT (`12%`, `19%`, `32%`) reinwestowane do portfela oraz 10% ryczałt na koniec.
- **Zaawansowana analityka ryzyka i obsunięć (Drawdown) na prawdziwych danych**:
  - Empiryczna szansa (%) na obsunięcie kapitału $\ge 5\%, 10\%, 15\%, 20\%, 30\%, 40\%$ w skali roku oraz całego horyzontu.
  - Tabela największych historycznych krachów portfela (`Szczyt → Dołek → Wyjście na szczyt`, czas spadku, czas pod wodą).
  - Analiza wszystkich kroczących okien historycznych (*Rolling Windows 2000–2026*): najlepszy, medianowy i najgorszy historyczny moment startu.
  - Wskaźniki **Sharpe Ratio**, **Sortino Ratio**, **Calmar Ratio**, **VaR 95%**, **CVaR 95% (Expected Shortfall)** oraz interaktywne dymki edukacyjne (`?`) wyjaśniające każdą statystykę.

## 🚀 Uruchomienie

1. **Bezpośrednio w przeglądarce:** otwórz plik `index.html`.
2. **Przez lokalny serwer Node.js:**
   ```bash
   node server.js
   ```
   Aplikacja będzie dostępna pod adresem `http://localhost:3000`.
