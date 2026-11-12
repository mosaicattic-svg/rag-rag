import { Candle, ChartType, TimeFrame, OrderBookLevel, TimeAndSalesTrade } from '../types/market';

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
  count: number = 85
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

  const volatility = 0.014;
  let currentPrice = basePrice * (1 - (Math.random() - 0.48) * 0.14);

  for (let i = count - 1; i >= 0; i--) {
    const time = now - i * stepMs;
    const delta = (Math.random() - 0.49) * currentPrice * volatility;
    const open = currentPrice;
    let close = currentPrice + delta;
    if (i === 0) close = basePrice;

    const high = Math.max(open, close) + Math.random() * currentPrice * (volatility * 0.65);
    const low = Math.min(open, close) - Math.random() * currentPrice * (volatility * 0.65);
    const volume = Math.round((Math.random() * 0.8 + 0.3) * (basePrice > 1000 ? 5000 : 250000));

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
 * Computes Bollinger Bands (20, 2)
 */
export function computeBollingerBands(
  candles: Candle[],
  period: number = 20,
  stdDevMultiplier: number = 2
): { upper: (number | null)[]; middle: (number | null)[]; lower: (number | null)[] } {
  const middle = computeSMA(candles, period);
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];

  candles.forEach((c, i) => {
    const ma = middle[i];
    if (ma === null || i < period - 1) {
      upper.push(null);
      lower.push(null);
    } else {
      let sumSqDiff = 0;
      for (let p = 0; p < period; p++) {
        const diff = candles[i - p].close - ma;
        sumSqDiff += diff * diff;
      }
      const stdDev = Math.sqrt(sumSqDiff / period);
      upper.push(ma + stdDev * stdDevMultiplier);
      lower.push(ma - stdDev * stdDevMultiplier);
    }
  });

  return { upper, middle, lower };
}

/**
 * Computes Volume-Weighted Average Price (VWAP)
 */
export function computeVWAP(candles: Candle[]): (number | null)[] {
  let cumVolume = 0;
  let cumTypicalPriceVol = 0;

  return candles.map((c) => {
    const typicalPrice = (c.high + c.low + c.close) / 3;
    cumVolume += c.volume;
    cumTypicalPriceVol += typicalPrice * c.volume;
    return cumVolume > 0 ? cumTypicalPriceVol / cumVolume : null;
  });
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
 * Computes MACD (12, 26, 9)
 */
export function computeMACD(
  candles: Candle[]
): { macd: (number | null)[]; signal: (number | null)[]; histogram: (number | null)[] } {
  const ema12 = computeEMA(candles, 12);
  const ema26 = computeEMA(candles, 26);
  const macd: (number | null)[] = [];

  candles.forEach((_, i) => {
    if (ema12[i] !== null && ema26[i] !== null) {
      macd.push(ema12[i]! - ema26[i]!);
    } else {
      macd.push(null);
    }
  });

  // Calculate 9 EMA of MACD line
  const validMacd = macd.filter((v) => v !== null) as number[];
  const nullCount = macd.length - validMacd.length;
  
  // Approximate signal
  const signal: (number | null)[] = [];
  const k = 2 / 10;
  let curSignal: number | null = null;

  for (let i = 0; i < macd.length; i++) {
    const m = macd[i];
    if (m === null || i < nullCount + 8) {
      signal.push(null);
    } else if (curSignal === null) {
      curSignal = m;
      signal.push(curSignal);
    } else {
      curSignal = m * k + curSignal * (1 - k);
      signal.push(curSignal);
    }
  }

  const histogram: (number | null)[] = [];
  candles.forEach((_, i) => {
    if (macd[i] !== null && signal[i] !== null) {
      histogram.push(macd[i]! - signal[i]!);
    } else {
      histogram.push(null);
    }
  });

  return { macd, signal, histogram };
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

/**
 * Synthesizes an acoustic audio notification for trade fill / price alert
 */
export function playAudioFeedback(type: 'fill' | 'alert' | 'click' = 'fill') {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'fill') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else if (type === 'alert') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch {
    // Ignore audio autoplay restrictions
  }
}

/**
 * Generate synthetic L2 order book levels
 */
export function generateOrderBook(midPrice: number, spreadPips: number = 0.02): { bids: OrderBookLevel[]; asks: OrderBookLevel[] } {
  const bids: OrderBookLevel[] = [];
  const asks: OrderBookLevel[] = [];
  const levels = 8;
  const tickStep = midPrice > 1000 ? 1 : midPrice > 100 ? 0.05 : 0.01;

  let cumBidTotal = 0;
  for (let i = 1; i <= levels; i++) {
    const price = midPrice - (i * tickStep) - (spreadPips / 2);
    const size = Math.round((Math.random() * 40 + 10) * (midPrice > 1000 ? 0.5 : 10));
    cumBidTotal += size;
    bids.push({
      price: Number(price.toFixed(2)),
      size,
      total: cumBidTotal,
      depthPercent: Math.min(100, (i / levels) * 90 + Math.random() * 10),
    });
  }

  let cumAskTotal = 0;
  for (let i = 1; i <= levels; i++) {
    const price = midPrice + (i * tickStep) + (spreadPips / 2);
    const size = Math.round((Math.random() * 40 + 10) * (midPrice > 1000 ? 0.5 : 10));
    cumAskTotal += size;
    asks.push({
      price: Number(price.toFixed(2)),
      size,
      total: cumAskTotal,
      depthPercent: Math.min(100, (i / levels) * 90 + Math.random() * 10),
    });
  }

  return { bids, asks };
}
