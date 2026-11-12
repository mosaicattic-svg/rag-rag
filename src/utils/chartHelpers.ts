import { Candle, ChartType, TimeFrame } from '../types/market';

/**
 * Format currency with proper decimal places based on price magnitude
 */
export function formatPrice(price: number, category: string = 'stock'): string {
  if (category === 'forex') {
    return price.toFixed(4);
  }
  if (price >= 1000) {
    return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (price >= 1) {
    return price.toFixed(2);
  }
  if (price >= 0.01) {
    return price.toFixed(4);
  }
  return price.toFixed(6);
}

/**
 * Format percentage with explicit sign
 */
export function formatPercent(val: number): string {
  const sign = val > 0 ? '+' : '';
  return `${sign}${val.toFixed(2)}%`;
}

/**
 * Format large numbers like 1.25T, 450.8B, 12.4M
 */
export function formatLargeNumber(num: number): string {
  if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return num.toString();
}

/**
 * Generates synthetic realistic OHLC data for a symbol and timeframe
 */
export function generateCandles(
  basePrice: number,
  timeframe: TimeFrame,
  count: number = 70
): Candle[] {
  const candles: Candle[] = [];
  const now = Date.now();
  
  let stepMs = 5 * 60 * 1000; // 5 min default for 1D
  if (timeframe === '5D') stepMs = 30 * 60 * 1000;
  if (timeframe === '1M') stepMs = 4 * 3600 * 1000;
  if (timeframe === '3M') stepMs = 12 * 3600 * 1000;
  if (timeframe === '6M') stepMs = 24 * 3600 * 1000;
  if (timeframe === '1Y') stepMs = 48 * 3600 * 1000;
  if (timeframe === '5Y' || timeframe === 'ALL') stepMs = 7 * 24 * 3600 * 1000;

  // Derive initial price backwards so current candle ends near basePrice
  const volatility = 0.015;
  let currentPrice = basePrice * (1 - (Math.random() - 0.45) * 0.12);

  for (let i = count - 1; i >= 0; i--) {
    const time = now - i * stepMs;
    const delta = (Math.random() - 0.49) * currentPrice * volatility;
    const open = currentPrice;
    let close = currentPrice + delta;
    if (i === 0) close = basePrice; // make last candle match latest quote

    const high = Math.max(open, close) + Math.random() * currentPrice * (volatility * 0.7);
    const low = Math.min(open, close) - Math.random() * currentPrice * (volatility * 0.7);
    const volume = Math.round((Math.random() * 0.8 + 0.4) * (basePrice > 1000 ? 5000 : 250000));

    candles.push({
      time,
      open,
      high,
      low,
      close,
      volume,
    });

    currentPrice = close;
  }

  return candles;
}

/**
 * Computes Simple Moving Average (SMA)
 */
export function computeSMA(candles: Candle[], period: number): (number | null)[] {
  return candles.map((candle, idx) => {
    if (idx < period - 1) return null;
    let sum = 0;
    for (let p = 0; p < period; p++) {
      sum += candles[idx - p].close;
    }
    return sum / period;
  });
}

/**
 * Computes Exponential Moving Average (EMA)
 */
export function computeEMA(candles: Candle[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  const k = 2 / (period + 1);
  let prevEMA: number | null = null;

  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else if (i === period - 1) {
      let sum = 0;
      for (let p = 0; p < period; p++) {
        sum += candles[i - p].close;
      }
      prevEMA = sum / period;
      result.push(prevEMA);
    } else {
      if (prevEMA !== null) {
        prevEMA = candles[i].close * k + prevEMA * (1 - k);
        result.push(prevEMA);
      } else {
        result.push(null);
      }
    }
  }
  return result;
}

/**
 * Computes Relative Strength Index (RSI 14)
 */
export function computeRSI(candles: Candle[], period: number = 14): (number | null)[] {
  const rsi: (number | null)[] = [];
  let gains: number[] = [];
  let losses: number[] = [];

  for (let i = 0; i < candles.length; i++) {
    if (i === 0) {
      rsi.push(null);
      continue;
    }

    const change = candles[i].close - candles[i - 1].close;
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);

    if (i < period) {
      rsi.push(null);
    } else if (i === period) {
      const avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
      const avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
      if (avgLoss === 0) {
        rsi.push(100);
      } else {
        const rs = avgGain / avgLoss;
        rsi.push(100 - 100 / (1 + rs));
      }
    } else {
      const prevRsiIdx = i - 1;
      const prevAvgGain = gains.slice(i - period, i).reduce((a, b) => a + b, 0) / period;
      const prevAvgLoss = losses.slice(i - period, i).reduce((a, b) => a + b, 0) / period;
      const curGain = gains[gains.length - 1];
      const curLoss = losses[losses.length - 1];
      const avgGain = (prevAvgGain * (period - 1) + curGain) / period;
      const avgLoss = (prevAvgLoss * (period - 1) + curLoss) / period;

      if (avgLoss === 0) {
        rsi.push(100);
      } else {
        const rs = avgGain / avgLoss;
        rsi.push(100 - 100 / (1 + rs));
      }
    }
  }

  return rsi;
}

/**
 * Converts regular candles to Heikin-Ashi candles
 */
export function convertToHeikinAshi(candles: Candle[]): Candle[] {
  const haCandles: Candle[] = [];

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const haClose = (c.open + c.high + c.low + c.close) / 4;
    let haOpen = c.open;

    if (i > 0) {
      haOpen = (haCandles[i - 1].open + haCandles[i - 1].close) / 2;
    }

    const haHigh = Math.max(c.high, haOpen, haClose);
    const haLow = Math.min(c.low, haOpen, haClose);

    haCandles.push({
      time: c.time,
      open: haOpen,
      high: haHigh,
      low: haLow,
      close: haClose,
      volume: c.volume,
    });
  }

  return haCandles;
}

/**
 * Format timestamps nicely for chart axes and crosshairs
 */
export function formatAxisTime(timestamp: number, timeframe: TimeFrame): string {
  const d = new Date(timestamp);
  if (timeframe === '1D') {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (timeframe === '5D' || timeframe === '1M') {
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:00`;
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: timeframe === '5Y' || timeframe === 'ALL' ? '2-digit' : undefined });
}
