import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Candle, ChartType, MarketItem, TimeFrame } from '../types/market';
import {
  generateCandles,
  computeSMA,
  computeRSI,
  convertToHeikinAshi,
  formatPrice,
  formatPercent,
  formatAxisTime,
  formatLargeNumber,
} from '../utils/chartHelpers';
import {
  Maximize2,
  TrendingUp,
  BarChart2,
  Activity,
  Layers,
  ChevronDown,
} from 'lucide-react';

interface InteractiveChartProps {
  item: MarketItem;
  theme: 'dark' | 'light';
  onQuickTrade?: (item: MarketItem, side: 'buy' | 'sell') => void;
  onSetAlert?: (item: MarketItem) => void;
}

export const InteractiveChart: React.FC<InteractiveChartProps> = ({
  item,
  theme,
  onQuickTrade,
  onSetAlert,
}) => {
  const [timeframe, setTimeframe] = useState<TimeFrame>('1D');
  const [chartType, setChartType] = useState<ChartType>('candlestick');
  const [showSMA20, setShowSMA20] = useState<boolean>(true);
  const [showSMA50, setShowSMA50] = useState<boolean>(false);
  const [showVolume, setShowVolume] = useState<boolean>(true);
  const [showRSI, setShowRSI] = useState<boolean>(false);

  // Crosshair state
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Generate base candles
  const rawCandles = useMemo(() => {
    return generateCandles(item.price, timeframe, 80);
  }, [item.symbol, item.price, timeframe]);

  // Derived candles based on chart style
  const candles = useMemo(() => {
    if (chartType === 'heikin-ashi') {
      return convertToHeikinAshi(rawCandles);
    }
    return rawCandles;
  }, [rawCandles, chartType]);

  // Indicators
  const sma20 = useMemo(() => computeSMA(rawCandles, 20), [rawCandles]);
  const sma50 = useMemo(() => computeSMA(rawCandles, 50), [rawCandles]);
  const rsi = useMemo(() => computeRSI(rawCandles, 14), [rawCandles]);

  // Active hover candle or last candle
  const activeCandle = hoverIndex !== null && candles[hoverIndex]
    ? candles[hoverIndex]
    : candles[candles.length - 1];

  const activeRSI = hoverIndex !== null && rsi[hoverIndex] !== null
    ? rsi[hoverIndex]
    : rsi[rsi.length - 1];

  // Render chart on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !containerRef.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = Math.max(340, rect.height);

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(dpr, dpr);

    const isDark = theme === 'dark';
    const bgCol = isDark ? '#131722' : '#ffffff';
    const gridCol = isDark ? '#1f2430' : '#f0f3fa';
    const textCol = isDark ? '#787b86' : '#9598a1';
    const upCol = '#089981';
    const downCol = '#f23645';

    // Clear background
    ctx.fillStyle = bgCol;
    ctx.fillRect(0, 0, width, height);

    if (candles.length === 0) return;

    // Layout partitioning
    const rightMargin = 72; // price axis width
    const bottomMargin = 26; // time axis height
    const rsiHeight = showRSI ? 80 : 0;
    const chartHeight = height - bottomMargin - rsiHeight;
    const chartWidth = width - rightMargin;

    // Calculate Price Bounds
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    let maxVolume = 0;

    candles.forEach((c) => {
      if (c.low < minPrice) minPrice = c.low;
      if (c.high > maxPrice) maxPrice = c.high;
      if (c.volume > maxVolume) maxVolume = c.volume;
    });

    // Add 4% vertical padding to price
    const priceRange = maxPrice - minPrice || 1;
    minPrice -= priceRange * 0.04;
    maxPrice += priceRange * 0.04;
    const adjRange = maxPrice - minPrice;

    // Helper to map price to Y
    const getY = (val: number) => {
      return chartHeight - ((val - minPrice) / adjRange) * chartHeight;
    };

    // Helper to map index to X
    const candleWidth = chartWidth / candles.length;
    const getX = (idx: number) => {
      return idx * candleWidth + candleWidth / 2;
    };

    // Draw Horizontal Grid & Price Ticks
    const numPriceSteps = 6;
    ctx.strokeStyle = gridCol;
    ctx.lineWidth = 1;
    ctx.fillStyle = textCol;
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    for (let i = 0; i <= numPriceSteps; i++) {
      const priceVal = minPrice + (adjRange / numPriceSteps) * i;
      const y = getY(priceVal);

      // Grid line
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(chartWidth, y);
      ctx.stroke();

      // Price Label
      ctx.fillText(formatPrice(priceVal, item.category), chartWidth + 8, y);
    }

    // Draw Vertical Grid & Time Ticks
    const timeStep = Math.max(1, Math.floor(candles.length / 7));
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    for (let i = 0; i < candles.length; i += timeStep) {
      const x = getX(i);

      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, chartHeight);
      ctx.stroke();

      // Time label
      const timeStr = formatAxisTime(candles[i].time, timeframe);
      ctx.fillText(timeStr, x, chartHeight + 6);
    }

    // Draw Volume Bars if enabled
    if (showVolume && maxVolume > 0) {
      const volMaxH = chartHeight * 0.22;
      candles.forEach((c, i) => {
        const x = i * candleWidth + 1;
        const barW = Math.max(1, candleWidth - 2);
        const barH = (c.volume / maxVolume) * volMaxH;
        const y = chartHeight - barH;

        ctx.fillStyle = c.close >= c.open
          ? isDark ? 'rgba(8, 153, 129, 0.25)' : 'rgba(8, 153, 129, 0.3)'
          : isDark ? 'rgba(242, 54, 69, 0.25)' : 'rgba(242, 54, 69, 0.3)';
        ctx.fillRect(x, y, barW, barH);
      });
    }

    // Draw Chart Data (Candlesticks, Area, or Line)
    if (chartType === 'candlestick' || chartType === 'heikin-ashi') {
      candles.forEach((c, i) => {
        const x = getX(i);
        const isUp = c.close >= c.open;
        const col = isUp ? upCol : downCol;

        // Wick
        ctx.strokeStyle = col;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x, getY(c.high));
        ctx.lineTo(x, getY(c.low));
        ctx.stroke();

        // Candle Body
        const openY = getY(c.open);
        const closeY = getY(c.close);
        const bodyY = Math.min(openY, closeY);
        const bodyH = Math.max(1.5, Math.abs(closeY - openY));
        const bodyW = Math.max(2, candleWidth * 0.72);

        ctx.fillStyle = col;
        ctx.fillRect(x - bodyW / 2, bodyY, bodyW, bodyH);
      });
    } else if (chartType === 'area') {
      // Area Chart with Gradient
      ctx.beginPath();
      ctx.moveTo(getX(0), getY(candles[0].close));
      for (let i = 1; i < candles.length; i++) {
        ctx.lineTo(getX(i), getY(candles[i].close));
      }

      // Line
      ctx.strokeStyle = '#2962ff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Gradient Fill
      ctx.lineTo(getX(candles.length - 1), chartHeight);
      ctx.lineTo(getX(0), chartHeight);
      ctx.closePath();

      const grad = ctx.createLinearGradient(0, 0, 0, chartHeight);
      grad.addColorStop(0, 'rgba(41, 98, 255, 0.35)');
      grad.addColorStop(1, 'rgba(41, 98, 255, 0.01)');
      ctx.fillStyle = grad;
      ctx.fill();
    } else if (chartType === 'line') {
      ctx.beginPath();
      ctx.moveTo(getX(0), getY(candles[0].close));
      for (let i = 1; i < candles.length; i++) {
        ctx.lineTo(getX(i), getY(candles[i].close));
      }
      ctx.strokeStyle = '#2962ff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Draw Moving Averages
    if (showSMA20) {
      ctx.strokeStyle = '#f59e0b'; // Amber 500
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      let started = false;
      sma20.forEach((val, i) => {
        if (val !== null) {
          const x = getX(i);
          const y = getY(val);
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      });
      ctx.stroke();
    }

    if (showSMA50) {
      ctx.strokeStyle = '#06b6d4'; // Cyan 500
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      let started = false;
      sma50.forEach((val, i) => {
        if (val !== null) {
          const x = getX(i);
          const y = getY(val);
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      });
      ctx.stroke();
    }

    // Current Price Indicator on Right Axis
    const curY = getY(item.price);
    const curIsUp = item.change >= 0;
    const badgeColor = curIsUp ? upCol : downCol;

    ctx.fillStyle = badgeColor;
    ctx.fillRect(chartWidth, curY - 10, rightMargin, 20);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(formatPrice(item.price, item.category), chartWidth + 6, curY);

    // Current price horizontal dashed line
    ctx.strokeStyle = badgeColor;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(0, curY);
    ctx.lineTo(chartWidth, curY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Optional RSI Pane
    if (showRSI) {
      const rsiTop = chartHeight + bottomMargin;
      const rsiW = chartWidth;
      const rsiH = rsiHeight - 12;

      // Pane divider
      ctx.strokeStyle = isDark ? '#2a2e39' : '#e0e3eb';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, rsiTop);
      ctx.lineTo(width, rsiTop);
      ctx.stroke();

      // RSI Levels 70 and 30
      const getRsiY = (val: number) => rsiTop + rsiH - (val / 100) * rsiH;

      ctx.strokeStyle = isDark ? '#262b3d' : '#e5e9f2';
      ctx.setLineDash([2, 4]);

      // 70 line
      ctx.beginPath();
      ctx.moveTo(0, getRsiY(70));
      ctx.lineTo(rsiW, getRsiY(70));
      ctx.stroke();

      // 30 line
      ctx.beginPath();
      ctx.moveTo(0, getRsiY(30));
      ctx.lineTo(rsiW, getRsiY(30));
      ctx.stroke();
      ctx.setLineDash([]);

      // RSI Labels
      ctx.fillStyle = textCol;
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillText('70', rsiW + 6, getRsiY(70));
      ctx.fillText('30', rsiW + 6, getRsiY(30));
      ctx.fillText('RSI (14)', 8, rsiTop + 14);

      // Plot RSI line
      ctx.strokeStyle = '#a855f7'; // Purple 500
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      let started = false;
      rsi.forEach((val, i) => {
        if (val !== null) {
          const x = getX(i);
          const y = getRsiY(val);
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      });
      ctx.stroke();
    }

    // Crosshair rendering
    if (hoverIndex !== null && mousePos) {
      const crossX = getX(hoverIndex);
      const crossY = mousePos.y;

      ctx.strokeStyle = isDark ? '#4b5563' : '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);

      // Vertical line
      ctx.beginPath();
      ctx.moveTo(crossX, 0);
      ctx.lineTo(crossX, height - (showRSI ? 0 : bottomMargin));
      ctx.stroke();

      // Horizontal line in price chart
      if (crossY <= chartHeight) {
        ctx.beginPath();
        ctx.moveTo(0, crossY);
        ctx.lineTo(chartWidth, crossY);
        ctx.stroke();

        // Calculate hovered price
        const hoverPrice = maxPrice - (crossY / chartHeight) * adjRange;
        ctx.setLineDash([]);
        ctx.fillStyle = isDark ? '#374151' : '#475569';
        ctx.fillRect(chartWidth, crossY - 10, rightMargin, 20);

        ctx.fillStyle = '#ffffff';
        ctx.font = '11px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(formatPrice(hoverPrice, item.category), chartWidth + 6, crossY);
      }

      // Time tag at bottom
      ctx.setLineDash([]);
      const timeStr = formatAxisTime(candles[hoverIndex].time, timeframe);
      const tagW = ctx.measureText(timeStr).width + 12;

      ctx.fillStyle = isDark ? '#374151' : '#475569';
      ctx.fillRect(crossX - tagW / 2, chartHeight, tagW, 20);
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(timeStr, crossX, chartHeight + 10);
    }
  }, [
    candles,
    theme,
    chartType,
    timeframe,
    showSMA20,
    showSMA50,
    showVolume,
    showRSI,
    hoverIndex,
    mousePos,
    item.price,
    item.category,
    item.change,
    sma20,
    sma50,
    rsi,
  ]);

  // Handle Mouse Movement for Crosshair
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || candles.length === 0) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const chartWidth = rect.width - 72;
    if (x >= 0 && x <= chartWidth) {
      const candleWidth = chartWidth / candles.length;
      const idx = Math.min(candles.length - 1, Math.max(0, Math.floor(x / candleWidth)));
      setHoverIndex(idx);
      setMousePos({ x, y });
    } else {
      setHoverIndex(null);
      setMousePos(null);
    }
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
    setMousePos(null);
  };

  const isUp = item.change >= 0;

  return (
    <div className="flex flex-col bg-white dark:bg-[#131722] border border-slate-200 dark:border-[#2a2e39] rounded-xl overflow-hidden shadow-sm">
      {/* Chart Top Bar - Asset Header & Live Stats */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-slate-200 dark:border-[#2a2e39]">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">
                {item.symbol}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-[#1e222d] text-slate-600 dark:text-slate-400 font-medium">
                {item.exchange}
              </span>
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                {item.name}
              </span>
            </div>
            {/* Live Price and Points */}
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                {formatPrice(item.price, item.category)}
              </span>
              <span
                className={`text-sm font-semibold font-mono tabular-nums ${
                  isUp ? 'text-[#089981]' : 'text-[#f23645]'
                }`}
              >
                {isUp ? '+' : ''}
                {formatPrice(item.change, item.category)} ({formatPercent(item.changePercent)})
              </span>
            </div>
          </div>
        </div>

        {/* OHLC Bar for current crosshair point */}
        <div className="hidden lg:flex items-center gap-4 text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
          <div>
            <span className="text-slate-400 dark:text-slate-500">O: </span>
            <span className="text-slate-800 dark:text-slate-200">
              {formatPrice(activeCandle?.open || item.open, item.category)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-500">H: </span>
            <span className="text-slate-800 dark:text-slate-200">
              {formatPrice(activeCandle?.high || item.high, item.category)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-500">L: </span>
            <span className="text-slate-800 dark:text-slate-200">
              {formatPrice(activeCandle?.low || item.low, item.category)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-500">C: </span>
            <span className="text-slate-800 dark:text-slate-200">
              {formatPrice(activeCandle?.close || item.price, item.category)}
            </span>
          </div>
          {showVolume && (
            <div>
              <span className="text-slate-400 dark:text-slate-500">Vol: </span>
              <span className="text-slate-800 dark:text-slate-200">
                {formatLargeNumber(activeCandle?.volume || item.volumeNum)}
              </span>
            </div>
          )}
          {showRSI && activeRSI !== null && (
            <div>
              <span className="text-purple-400">RSI: </span>
              <span className="text-purple-300">{activeRSI.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Action Buttons: Quick Buy/Sell & Set Alert */}
        <div className="flex items-center gap-2">
          {onQuickTrade && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onQuickTrade(item, 'buy')}
                className="px-3 py-1.5 text-xs font-bold text-white bg-[#089981] hover:bg-[#077d69] rounded-lg transition-colors shadow-sm"
              >
                Buy {item.symbol}
              </button>
              <button
                onClick={() => onQuickTrade(item, 'sell')}
                className="px-3 py-1.5 text-xs font-bold text-white bg-[#f23645] hover:bg-[#d62736] rounded-lg transition-colors shadow-sm"
              >
                Sell
              </button>
            </div>
          )}
          {onSetAlert && (
            <button
              onClick={() => onSetAlert(item)}
              className="p-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1e222d] border border-slate-200 dark:border-[#2a2e39] rounded-lg transition-colors"
              title="Set Price Alert"
            >
              Alert
            </button>
          )}
        </div>
      </div>

      {/* Toolbar: Timeframe Selector & Indicators */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 bg-slate-50/70 dark:bg-[#181c27] border-b border-slate-200 dark:border-[#2a2e39] text-xs">
        {/* Timeframe Buttons */}
        <div className="flex items-center gap-1">
          {(['1D', '5D', '1M', '3M', '6M', '1Y', '5Y', 'ALL'] as TimeFrame[]).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2.5 py-1 font-semibold rounded transition-colors ${
                timeframe === tf
                  ? 'bg-slate-900 dark:bg-[#2962ff] text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-[#2a2e39]'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Chart Style Toggles & Indicators */}
        <div className="flex items-center gap-2">
          {/* Chart Type Dropdown/Selector */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-200/60 dark:bg-[#222634] rounded-lg">
            <button
              onClick={() => setChartType('candlestick')}
              className={`px-2 py-1 rounded font-medium transition-colors ${
                chartType === 'candlestick'
                  ? 'bg-white dark:bg-[#131722] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Candlestick Chart"
            >
              Candles
            </button>
            <button
              onClick={() => setChartType('area')}
              className={`px-2 py-1 rounded font-medium transition-colors ${
                chartType === 'area'
                  ? 'bg-white dark:bg-[#131722] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Area Gradient Chart"
            >
              Area
            </button>
            <button
              onClick={() => setChartType('heikin-ashi')}
              className={`px-2 py-1 rounded font-medium transition-colors ${
                chartType === 'heikin-ashi'
                  ? 'bg-white dark:bg-[#131722] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Heikin-Ashi Trend Candlesticks"
            >
              Heikin Ashi
            </button>
          </div>

          {/* Indicator toggles */}
          <div className="hidden sm:flex items-center gap-1 border-l border-slate-300 dark:border-[#2a2e39] pl-2">
            <button
              onClick={() => setShowSMA20(!showSMA20)}
              className={`px-2 py-1 font-medium rounded transition-colors ${
                showSMA20
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-[#2a2e39]'
              }`}
            >
              MA 20
            </button>
            <button
              onClick={() => setShowSMA50(!showSMA50)}
              className={`px-2 py-1 font-medium rounded transition-colors ${
                showSMA50
                  ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-[#2a2e39]'
              }`}
            >
              MA 50
            </button>
            <button
              onClick={() => setShowVolume(!showVolume)}
              className={`px-2 py-1 font-medium rounded transition-colors ${
                showVolume
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-[#2a2e39]'
              }`}
            >
              Volume
            </button>
            <button
              onClick={() => setShowRSI(!showRSI)}
              className={`px-2 py-1 font-medium rounded transition-colors ${
                showRSI
                  ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-[#2a2e39]'
              }`}
            >
              RSI
            </button>
          </div>
        </div>
      </div>

      {/* Main Chart Canvas Viewport */}
      <div
        ref={containerRef}
        className="relative w-full h-[400px] cursor-crosshair select-none"
      >
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="w-full h-full block"
        />
      </div>

      {/* 52-Week Range Bar & Technical Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-[#1a1e29] border-t border-slate-200 dark:border-[#2a2e39] text-xs">
        <div>
          <div className="text-slate-500 dark:text-slate-400 mb-1">52-Week Range</div>
          <div className="flex items-center gap-2 font-mono">
            <span>{formatPrice(item.fiftyTwoWeekLow, item.category)}</span>
            <div className="flex-1 h-1.5 bg-slate-200 dark:bg-[#2a2e39] rounded-full overflow-hidden relative">
              <div
                className="h-full bg-[#2962ff] rounded-full"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(
                      0,
                      ((item.price - item.fiftyTwoWeekLow) /
                        (item.fiftyTwoWeekHigh - item.fiftyTwoWeekLow || 1)) *
                        100
                    )
                  )}%`,
                }}
              />
            </div>
            <span>{formatPrice(item.fiftyTwoWeekHigh, item.category)}</span>
          </div>
        </div>

        <div>
          <div className="text-slate-500 dark:text-slate-400 mb-1">Trading Volume</div>
          <div className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
            {item.volume} shares
          </div>
        </div>

        {item.marketCap && (
          <div>
            <div className="text-slate-500 dark:text-slate-400 mb-1">Market Capitalization</div>
            <div className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
              ${item.marketCap}
            </div>
          </div>
        )}

        <div>
          <div className="text-slate-500 dark:text-slate-400 mb-1">Technical Rating</div>
          <div
            className={`font-bold uppercase tracking-wider ${
              item.technicalRating.includes('Buy')
                ? 'text-[#089981]'
                : item.technicalRating.includes('Sell')
                ? 'text-[#f23645]'
                : 'text-amber-500'
            }`}
          >
            {item.technicalRating}
          </div>
        </div>
      </div>
    </div>
  );
};
