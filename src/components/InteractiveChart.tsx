import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Candle,
  ChartType,
  MarketItem,
  TimeFrame,
  DrawingTool,
  DrawingItem,
  LayoutMode,
} from '../types/market';
import {
  generateCandles,
  computeSMA,
  computeEMA,
  computeBollingerBands,
  computeVWAP,
  computeRSI,
  computeMACD,
  convertToHeikinAshi,
  formatPrice,
  formatPercent,
  formatAxisTime,
  formatLargeNumber,
  playAudioFeedback,
} from '../utils/chartHelpers';
import {
  TrendingUp,
  MousePointer,
  Minus,
  Maximize2,
  Trash2,
  Grid,
  Layers,
  Clock,
  Ruler,
  Compass,
  LayoutGrid,
} from 'lucide-react';

interface InteractiveChartProps {
  item: MarketItem;
  theme: 'dark' | 'light';
  onQuickTrade?: (item: MarketItem, side: 'buy' | 'sell') => void;
  onSetAlert?: (item: MarketItem) => void;
  layoutMode?: LayoutMode;
  onChangeLayout?: (mode: LayoutMode) => void;
  isCompact?: boolean;
}

export const InteractiveChart: React.FC<InteractiveChartProps> = ({
  item,
  theme,
  onQuickTrade,
  onSetAlert,
  layoutMode = '1x1',
  onChangeLayout,
  isCompact = false,
}) => {
  const [timeframe, setTimeframe] = useState<TimeFrame>('1D');
  const [chartType, setChartType] = useState<ChartType>('candlestick');

  // Indicators toggles
  const [showSMA20, setShowSMA20] = useState<boolean>(true);
  const [showSMA50, setShowSMA50] = useState<boolean>(false);
  const [showEMA9, setShowEMA9] = useState<boolean>(false);
  const [showBollinger, setShowBollinger] = useState<boolean>(false);
  const [showVWAP, setShowVWAP] = useState<boolean>(false);
  const [showVolume, setShowVolume] = useState<boolean>(true);
  const [subPane, setSubPane] = useState<'none' | 'rsi' | 'macd'>('none');

  // Drawing tools state
  const [activeDrawingTool, setActiveDrawingTool] = useState<DrawingTool>('cursor');
  const [drawings, setDrawings] = useState<DrawingItem[]>([]);
  const [currentDraftDrawing, setCurrentDraftDrawing] = useState<Partial<DrawingItem> | null>(null);

  // Pan & Zoom
  const [visibleCount, setVisibleCount] = useState<number>(75);
  const [panOffset, setPanOffset] = useState<number>(0);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStartMouseX, setPanStartMouseX] = useState<number>(0);
  const [panStartOffset, setPanStartOffset] = useState<number>(0);

  // Crosshair state
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  // Countdown timer to candle close
  const [countdownSecs, setCountdownSecs] = useState<number>(142);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdownSecs((prev) => (prev <= 1 ? 300 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format countdown mm:ss
  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Base raw candles
  const rawCandles = useMemo(() => {
    return generateCandles(item.price, timeframe, 120);
  }, [item.symbol, item.price, timeframe]);

  // Derived candles
  const allCandles = useMemo(() => {
    if (chartType === 'heikin-ashi') {
      return convertToHeikinAshi(rawCandles);
    }
    return rawCandles;
  }, [rawCandles, chartType]);

  // Sliced candles for Pan & Zoom
  const candles = useMemo(() => {
    const maxOffset = Math.max(0, allCandles.length - visibleCount);
    const clampedOffset = Math.min(maxOffset, Math.max(0, panOffset));
    const start = allCandles.length - visibleCount - clampedOffset;
    const end = start + visibleCount;
    return allCandles.slice(Math.max(0, start), Math.min(allCandles.length, end));
  }, [allCandles, visibleCount, panOffset]);

  // Pro Indicators
  const sma20 = useMemo(() => computeSMA(candles, 20), [candles]);
  const sma50 = useMemo(() => computeSMA(candles, 50), [candles]);
  const ema9 = useMemo(() => computeEMA(candles, 9), [candles]);
  const bollinger = useMemo(() => computeBollingerBands(candles, 20, 2), [candles]);
  const vwap = useMemo(() => computeVWAP(candles), [candles]);
  const rsi = useMemo(() => computeRSI(candles, 14), [candles]);
  const macd = useMemo(() => computeMACD(candles), [candles]);

  const activeCandle = hoverIndex !== null && candles[hoverIndex]
    ? candles[hoverIndex]
    : candles[candles.length - 1];

  // Render Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !containerRef.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = Math.max(isCompact ? 280 : 380, rect.height);

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(dpr, dpr);

    const isDark = theme === 'dark';
    const bgCol = isDark ? '#131722' : '#ffffff';
    const gridCol = isDark ? '#1e222d' : '#f0f3fa';
    const textCol = isDark ? '#787b86' : '#9598a1';
    const upCol = '#089981';
    const downCol = '#f23645';

    // Clear background
    ctx.fillStyle = bgCol;
    ctx.fillRect(0, 0, width, height);

    if (candles.length === 0) return;

    const rightMargin = 72;
    const bottomMargin = 26;
    const subPaneHeight = subPane !== 'none' ? (isCompact ? 65 : 85) : 0;
    const chartHeight = height - bottomMargin - subPaneHeight;
    const chartWidth = width - rightMargin;

    // Price Bounds
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    let maxVolume = 0;

    candles.forEach((c) => {
      if (c.low < minPrice) minPrice = c.low;
      if (c.high > maxPrice) maxPrice = c.high;
      if (c.volume > maxVolume) maxVolume = c.volume;
    });

    const priceRange = maxPrice - minPrice || 1;
    minPrice -= priceRange * 0.05;
    maxPrice += priceRange * 0.05;
    const adjRange = maxPrice - minPrice;

    const getY = (val: number) => chartHeight - ((val - minPrice) / adjRange) * chartHeight;
    const candleWidth = chartWidth / candles.length;
    const getX = (idx: number) => idx * candleWidth + candleWidth / 2;

    // Horizontal Grid & Price Ticks
    const numPriceSteps = isCompact ? 4 : 6;
    ctx.strokeStyle = gridCol;
    ctx.lineWidth = 1;
    ctx.fillStyle = textCol;
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    for (let i = 0; i <= numPriceSteps; i++) {
      const priceVal = minPrice + (adjRange / numPriceSteps) * i;
      const y = getY(priceVal);

      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(chartWidth, y);
      ctx.stroke();

      ctx.fillText(formatPrice(priceVal, item.category), chartWidth + 8, y);
    }

    // Vertical Grid & Time Ticks
    const timeStep = Math.max(1, Math.floor(candles.length / (isCompact ? 4 : 7)));
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    for (let i = 0; i < candles.length; i += timeStep) {
      const x = getX(i);

      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, chartHeight);
      ctx.stroke();

      const timeStr = formatAxisTime(candles[i].time, timeframe);
      ctx.fillText(timeStr, x, chartHeight + 6);
    }

    // Volume Bars
    if (showVolume && maxVolume > 0) {
      const volMaxH = chartHeight * 0.22;
      candles.forEach((c, i) => {
        const x = i * candleWidth + 1;
        const barW = Math.max(1, candleWidth - 2);
        const barH = (c.volume / maxVolume) * volMaxH;
        const y = chartHeight - barH;

        ctx.fillStyle = c.close >= c.open
          ? isDark ? 'rgba(8, 153, 129, 0.22)' : 'rgba(8, 153, 129, 0.28)'
          : isDark ? 'rgba(242, 54, 69, 0.22)' : 'rgba(242, 54, 69, 0.28)';
        ctx.fillRect(x, y, barW, barH);
      });
    }

    // Bollinger Bands Cloud
    if (showBollinger) {
      ctx.beginPath();
      let started = false;
      bollinger.upper.forEach((val, i) => {
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
      // Trace lower backwards for shaded channel
      for (let i = bollinger.lower.length - 1; i >= 0; i--) {
        const val = bollinger.lower[i];
        if (val !== null) {
          ctx.lineTo(getX(i), getY(val));
        }
      }
      ctx.closePath();
      ctx.fillStyle = isDark ? 'rgba(41, 98, 255, 0.08)' : 'rgba(41, 98, 255, 0.06)';
      ctx.fill();

      // Upper & Lower band lines
      ['upper', 'lower'].forEach((band) => {
        const arr = (bollinger as any)[band];
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 1;
        ctx.beginPath();
        let s = false;
        arr.forEach((val: number | null, i: number) => {
          if (val !== null) {
            const x = getX(i);
            const y = getY(val);
            if (!s) { ctx.moveTo(x, y); s = true; } else { ctx.lineTo(x, y); }
          }
        });
        ctx.stroke();
      });
    }

    // VWAP Line
    if (showVWAP) {
      ctx.strokeStyle = '#ec4899'; // Pink 500
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      let started = false;
      vwap.forEach((val, i) => {
        if (val !== null) {
          const x = getX(i);
          const y = getY(val);
          if (!started) { ctx.moveTo(x, y); started = true; } else { ctx.lineTo(x, y); }
        }
      });
      ctx.stroke();
    }

    // Candlesticks / Area / Line
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

        // Body
        const openY = getY(c.open);
        const closeY = getY(c.close);
        const bodyY = Math.min(openY, closeY);
        const bodyH = Math.max(1.5, Math.abs(closeY - openY));
        const bodyW = Math.max(2, candleWidth * 0.72);

        ctx.fillStyle = col;
        ctx.fillRect(x - bodyW / 2, bodyY, bodyW, bodyH);
      });
    } else if (chartType === 'area') {
      ctx.beginPath();
      ctx.moveTo(getX(0), getY(candles[0].close));
      for (let i = 1; i < candles.length; i++) {
        ctx.lineTo(getX(i), getY(candles[i].close));
      }
      ctx.strokeStyle = '#2962ff';
      ctx.lineWidth = 2;
      ctx.stroke();

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

    // Moving Averages
    if (showSMA20) {
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      let s = false;
      sma20.forEach((val, i) => {
        if (val !== null) {
          const x = getX(i);
          const y = getY(val);
          if (!s) { ctx.moveTo(x, y); s = true; } else { ctx.lineTo(x, y); }
        }
      });
      ctx.stroke();
    }

    if (showSMA50) {
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      let s = false;
      sma50.forEach((val, i) => {
        if (val !== null) {
          const x = getX(i);
          const y = getY(val);
          if (!s) { ctx.moveTo(x, y); s = true; } else { ctx.lineTo(x, y); }
        }
      });
      ctx.stroke();
    }

    if (showEMA9) {
      ctx.strokeStyle = '#8b5cf6'; // Purple 500
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      let s = false;
      ema9.forEach((val, i) => {
        if (val !== null) {
          const x = getX(i);
          const y = getY(val);
          if (!s) { ctx.moveTo(x, y); s = true; } else { ctx.lineTo(x, y); }
        }
      });
      ctx.stroke();
    }

    // DRAWINGS RENDERING
    const allRenderDrawings = [...drawings];
    if (currentDraftDrawing && currentDraftDrawing.startX !== undefined) {
      allRenderDrawings.push(currentDraftDrawing as DrawingItem);
    }

    allRenderDrawings.forEach((d) => {
      ctx.strokeStyle = d.color || '#2962ff';
      ctx.lineWidth = 2;

      if (d.type === 'horizontal') {
        const y = getY(d.priceStart);
        ctx.beginPath();
        ctx.setLineDash([4, 4]);
        ctx.moveTo(0, y);
        ctx.lineTo(chartWidth, y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Label on right axis
        ctx.fillStyle = '#2962ff';
        ctx.fillRect(chartWidth, y - 9, rightMargin, 18);
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillText(`H: ${formatPrice(d.priceStart, item.category)}`, chartWidth + 6, y);
      } else if (d.type === 'trendline' && d.endX !== undefined && d.endY !== undefined) {
        ctx.beginPath();
        ctx.moveTo(d.startX, d.startY);
        ctx.lineTo(d.endX, d.endY);
        ctx.stroke();
        // Circles at endpoints
        ctx.fillStyle = '#2962ff';
        ctx.beginPath();
        ctx.arc(d.startX, d.startY, 4, 0, Math.PI * 2);
        ctx.arc(d.endX, d.endY, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (d.type === 'fibonacci' && d.endY !== undefined && d.priceEnd !== undefined) {
        const p1 = d.priceStart;
        const p2 = d.priceEnd;
        const fibLevels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1.0];
        const fibColors = [
          '#64748b',
          '#ef4444',
          '#f59e0b',
          '#10b981',
          '#06b6d4',
          '#8b5cf6',
          '#64748b',
        ];

        fibLevels.forEach((level, idx) => {
          const fibPrice = p1 + (p2 - p1) * level;
          const y = getY(fibPrice);

          ctx.strokeStyle = fibColors[idx];
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(chartWidth, y);
          ctx.stroke();

          ctx.fillStyle = fibColors[idx];
          ctx.font = '10px "JetBrains Mono", monospace';
          ctx.fillText(`Fib ${(level * 100).toFixed(1)}% (${formatPrice(fibPrice, item.category)})`, 8, y - 4);
        });
      } else if (d.type === 'measure' && d.endX !== undefined && d.endY !== undefined && d.priceEnd !== undefined) {
        // Measure ruler rectangle
        const minX = Math.min(d.startX, d.endX);
        const maxX = Math.max(d.startX, d.endX);
        const minY = Math.min(d.startY, d.endY);
        const maxY = Math.max(d.startY, d.endY);

        ctx.fillStyle = 'rgba(41, 98, 255, 0.12)';
        ctx.fillRect(minX, minY, maxX - minX, maxY - minY);
        ctx.strokeStyle = '#2962ff';
        ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);

        // Stats tag
        const priceDelta = d.priceEnd - d.priceStart;
        const pctDelta = (priceDelta / d.priceStart) * 100;
        const label = `${formatPercent(pctDelta)} (${formatPrice(Math.abs(priceDelta))})`;
        ctx.fillStyle = '#2962ff';
        ctx.fillRect(minX, minY - 18, 120, 18);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px "JetBrains Mono", monospace';
        ctx.fillText(label, minX + 6, minY - 9);
      }
    });

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

    ctx.strokeStyle = badgeColor;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(0, curY);
    ctx.lineTo(chartWidth, curY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Sub-Pane (RSI or MACD)
    if (subPane !== 'none') {
      const paneTop = chartHeight + bottomMargin;
      const paneW = chartWidth;
      const paneH = subPaneHeight - 12;

      ctx.strokeStyle = isDark ? '#2a2e39' : '#e0e3eb';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, paneTop);
      ctx.lineTo(width, paneTop);
      ctx.stroke();

      if (subPane === 'rsi') {
        const getRsiY = (val: number) => paneTop + paneH - (val / 100) * paneH;

        ctx.strokeStyle = isDark ? '#262b3d' : '#e5e9f2';
        ctx.setLineDash([2, 4]);
        ctx.beginPath();
        ctx.moveTo(0, getRsiY(70));
        ctx.lineTo(paneW, getRsiY(70));
        ctx.moveTo(0, getRsiY(30));
        ctx.lineTo(paneW, getRsiY(30));
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = textCol;
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillText('70', paneW + 6, getRsiY(70));
        ctx.fillText('30', paneW + 6, getRsiY(30));
        ctx.fillText('RSI (14)', 8, paneTop + 14);

        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        let s = false;
        rsi.forEach((val, i) => {
          if (val !== null) {
            const x = getX(i);
            const y = getRsiY(val);
            if (!s) { ctx.moveTo(x, y); s = true; } else { ctx.lineTo(x, y); }
          }
        });
        ctx.stroke();
      } else if (subPane === 'macd') {
        // Draw MACD
        ctx.fillStyle = textCol;
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillText('MACD (12, 26, 9)', 8, paneTop + 14);

        const macdMidY = paneTop + paneH / 2;
        ctx.strokeStyle = isDark ? '#262b3d' : '#e5e9f2';
        ctx.beginPath();
        ctx.moveTo(0, macdMidY);
        ctx.lineTo(paneW, macdMidY);
        ctx.stroke();

        // Histogram bars
        macd.histogram.forEach((hist, i) => {
          if (hist !== null) {
            const x = getX(i);
            const h = hist * 8;
            ctx.fillStyle = hist >= 0 ? 'rgba(8, 153, 129, 0.5)' : 'rgba(242, 54, 69, 0.5)';
            ctx.fillRect(x - candleWidth * 0.35, macdMidY, candleWidth * 0.7, -h);
          }
        });

        // MACD line & signal
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        let s1 = false;
        macd.macd.forEach((m, i) => {
          if (m !== null) {
            const x = getX(i);
            const y = macdMidY - m * 8;
            if (!s1) { ctx.moveTo(x, y); s1 = true; } else { ctx.lineTo(x, y); }
          }
        });
        ctx.stroke();

        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        let s2 = false;
        macd.signal.forEach((sig, i) => {
          if (sig !== null) {
            const x = getX(i);
            const y = macdMidY - sig * 8;
            if (!s2) { ctx.moveTo(x, y); s2 = true; } else { ctx.lineTo(x, y); }
          }
        });
        ctx.stroke();
      }
    }

    // Crosshair rendering
    if (hoverIndex !== null && mousePos) {
      const crossX = getX(hoverIndex);
      const crossY = mousePos.y;

      ctx.strokeStyle = isDark ? '#4b5563' : '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);

      ctx.beginPath();
      ctx.moveTo(crossX, 0);
      ctx.lineTo(crossX, height - (subPane !== 'none' ? 0 : bottomMargin));
      ctx.stroke();

      if (crossY <= chartHeight) {
        ctx.beginPath();
        ctx.moveTo(0, crossY);
        ctx.lineTo(chartWidth, crossY);
        ctx.stroke();

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
    showEMA9,
    showBollinger,
    showVWAP,
    showVolume,
    subPane,
    hoverIndex,
    mousePos,
    item.price,
    item.category,
    item.change,
    sma20,
    sma50,
    ema9,
    bollinger,
    vwap,
    rsi,
    macd,
    drawings,
    currentDraftDrawing,
    isCompact,
  ]);

  // Mouse Interaction: Pan, Zoom, and Drawings
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const chartWidth = rect.width - 72;
    const chartHeight = rect.height - 26 - (subPane !== 'none' ? 75 : 0);

    if (x > chartWidth || y > chartHeight) return;

    // Price at mouse Y
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    candles.forEach((c) => {
      if (c.low < minPrice) minPrice = c.low;
      if (c.high > maxPrice) maxPrice = c.high;
    });
    const priceRange = maxPrice - minPrice || 1;
    const adjRange = priceRange * 1.1;
    const mousePrice = maxPrice + priceRange * 0.05 - (y / chartHeight) * adjRange;

    if (activeDrawingTool === 'cursor') {
      setIsPanning(true);
      setPanStartMouseX(e.clientX);
      setPanStartOffset(panOffset);
    } else if (activeDrawingTool === 'horizontal') {
      const newDrawing: DrawingItem = {
        id: `draw-${Date.now()}`,
        type: 'horizontal',
        startX: 0,
        startY: y,
        priceStart: mousePrice,
        color: '#2962ff',
      };
      setDrawings((prev) => [...prev, newDrawing]);
      setActiveDrawingTool('cursor');
      playAudioFeedback('click');
    } else if (
      activeDrawingTool === 'trendline' ||
      activeDrawingTool === 'fibonacci' ||
      activeDrawingTool === 'measure'
    ) {
      setCurrentDraftDrawing({
        id: `draw-${Date.now()}`,
        type: activeDrawingTool,
        startX: x,
        startY: y,
        endX: x,
        endY: y,
        priceStart: mousePrice,
        priceEnd: mousePrice,
        color: '#2962ff',
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || candles.length === 0) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const chartWidth = rect.width - 72;
    const chartHeight = rect.height - 26 - (subPane !== 'none' ? 75 : 0);

    // Pan handling
    if (isPanning) {
      const deltaX = e.clientX - panStartMouseX;
      const candleW = chartWidth / candles.length;
      const shiftBars = Math.round(deltaX / candleW);
      setPanOffset(Math.max(0, panStartOffset - shiftBars));
      return;
    }

    // Draft drawing update
    if (currentDraftDrawing) {
      let minPrice = Infinity;
      let maxPrice = -Infinity;
      candles.forEach((c) => {
        if (c.low < minPrice) minPrice = c.low;
        if (c.high > maxPrice) maxPrice = c.high;
      });
      const priceRange = maxPrice - minPrice || 1;
      const adjRange = priceRange * 1.1;
      const mousePrice = maxPrice + priceRange * 0.05 - (y / chartHeight) * adjRange;

      setCurrentDraftDrawing((prev) => ({
        ...prev,
        endX: x,
        endY: y,
        priceEnd: mousePrice,
      }));
    }

    // Crosshair update
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

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
    }
    if (currentDraftDrawing && currentDraftDrawing.endX !== undefined) {
      setDrawings((prev) => [...prev, currentDraftDrawing as DrawingItem]);
      setCurrentDraftDrawing(null);
      setActiveDrawingTool('cursor');
      playAudioFeedback('click');
    }
  };

  // Zoom using Wheel
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      // Zoom In
      setVisibleCount((prev) => Math.max(25, prev - 5));
    } else {
      // Zoom Out
      setVisibleCount((prev) => Math.min(allCandles.length, prev + 5));
    }
  };

  const handleClearDrawings = () => {
    setDrawings([]);
    setCurrentDraftDrawing(null);
    playAudioFeedback('click');
  };

  const isUp = item.change >= 0;

  return (
    <div className="flex bg-white dark:bg-[#131722] border border-slate-200 dark:border-[#2a2e39] rounded-xl overflow-hidden shadow-sm">
      {/* 1. Pro Drawing Tools Left Strip */}
      {!isCompact && (
        <div className="w-10 bg-slate-50 dark:bg-[#181c27] border-r border-slate-200 dark:border-[#2a2e39] flex flex-col items-center py-2 gap-1.5 shrink-0 z-10 select-none">
          <button
            onClick={() => setActiveDrawingTool('cursor')}
            className={`p-2 rounded-lg transition-colors ${
              activeDrawingTool === 'cursor'
                ? 'bg-blue-50 dark:bg-[#2962ff]/20 text-[#2962ff]'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Cursor / Pan Tool"
          >
            <MousePointer className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveDrawingTool('trendline')}
            className={`p-2 rounded-lg transition-colors ${
              activeDrawingTool === 'trendline'
                ? 'bg-blue-50 dark:bg-[#2962ff]/20 text-[#2962ff]'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Trend Line (Click & Drag)"
          >
            <TrendingUp className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveDrawingTool('horizontal')}
            className={`p-2 rounded-lg transition-colors ${
              activeDrawingTool === 'horizontal'
                ? 'bg-blue-50 dark:bg-[#2962ff]/20 text-[#2962ff]'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Horizontal Price Level (Click to Stamp)"
          >
            <Minus className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveDrawingTool('fibonacci')}
            className={`p-2 rounded-lg transition-colors ${
              activeDrawingTool === 'fibonacci'
                ? 'bg-blue-50 dark:bg-[#2962ff]/20 text-[#2962ff]'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Fibonacci Retracement (Click & Drag)"
          >
            <Grid className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveDrawingTool('measure')}
            className={`p-2 rounded-lg transition-colors ${
              activeDrawingTool === 'measure'
                ? 'bg-blue-50 dark:bg-[#2962ff]/20 text-[#2962ff]'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Measure Ruler (Click & Drag)"
          >
            <Ruler className="w-4 h-4" />
          </button>

          <div className="w-6 h-px bg-slate-200 dark:bg-[#2a2e39] my-1" />

          <button
            onClick={handleClearDrawings}
            className="p-2 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
            title="Clear All Drawings"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Main Chart Body */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 border-b border-slate-200 dark:border-[#2a2e39]">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white font-mono">
                  {item.symbol}
                </span>
                <span className="text-xs px-1.5 py-0.2 rounded bg-slate-100 dark:bg-[#1e222d] text-slate-600 dark:text-slate-400 font-medium">
                  {item.exchange}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[140px]">
                  {item.name}
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                  {formatPrice(item.price, item.category)}
                </span>
                <span
                  className={`text-xs font-semibold font-mono tabular-nums ${
                    isUp ? 'text-[#089981]' : 'text-[#f23645]'
                  }`}
                >
                  {isUp ? '+' : ''}
                  {formatPrice(item.change, item.category)} ({formatPercent(item.changePercent)})
                </span>
                {/* Bar Countdown Timer */}
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-slate-400 dark:text-slate-500 ml-2">
                  <Clock className="w-3 h-3" /> {formatCountdown(countdownSecs)}
                </span>
              </div>
            </div>
          </div>

          {/* OHLC Bar */}
          <div className="hidden xl:flex items-center gap-3 text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
            <div>
              <span className="text-slate-400">O: </span>
              <span className="text-slate-800 dark:text-slate-200">
                {formatPrice(activeCandle?.open || item.open, item.category)}
              </span>
            </div>
            <div>
              <span className="text-slate-400">H: </span>
              <span className="text-slate-800 dark:text-slate-200">
                {formatPrice(activeCandle?.high || item.high, item.category)}
              </span>
            </div>
            <div>
              <span className="text-slate-400">L: </span>
              <span className="text-slate-800 dark:text-slate-200">
                {formatPrice(activeCandle?.low || item.low, item.category)}
              </span>
            </div>
            <div>
              <span className="text-slate-400">C: </span>
              <span className="text-slate-800 dark:text-slate-200">
                {formatPrice(activeCandle?.close || item.price, item.category)}
              </span>
            </div>
          </div>

          {/* Action Tools: Multi-Chart Layout Switcher & Trade Buttons */}
          <div className="flex items-center gap-2">
            {onChangeLayout && (
              <div className="hidden md:flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-[#1e222d] rounded-lg text-xs">
                <button
                  onClick={() => onChangeLayout('1x1')}
                  className={`px-2 py-1 rounded font-mono ${
                    layoutMode === '1x1' ? 'bg-[#2962ff] text-white' : 'text-slate-400'
                  }`}
                  title="Single Chart View"
                >
                  1x1
                </button>
                <button
                  onClick={() => onChangeLayout('2x1')}
                  className={`px-2 py-1 rounded font-mono ${
                    layoutMode === '2x1' ? 'bg-[#2962ff] text-white' : 'text-slate-400'
                  }`}
                  title="Dual Chart Split View"
                >
                  2x1
                </button>
                <button
                  onClick={() => onChangeLayout('2x2')}
                  className={`px-2 py-1 rounded font-mono ${
                    layoutMode === '2x2' ? 'bg-[#2962ff] text-white' : 'text-slate-400'
                  }`}
                  title="Quad 4-Chart View"
                >
                  2x2
                </button>
              </div>
            )}

            {onQuickTrade && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    onQuickTrade(item, 'buy');
                    playAudioFeedback('fill');
                  }}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-[#089981] hover:bg-[#077d69] rounded-lg transition-colors shadow-sm"
                >
                  Buy
                </button>
                <button
                  onClick={() => {
                    onQuickTrade(item, 'sell');
                    playAudioFeedback('fill');
                  }}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-[#f23645] hover:bg-[#d62736] rounded-lg transition-colors shadow-sm"
                >
                  Sell
                </button>
              </div>
            )}

            {onSetAlert && (
              <button
                onClick={() => onSetAlert(item)}
                className="px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1e222d] border border-slate-200 dark:border-[#2a2e39] rounded-lg transition-colors"
                title="Create Price Alert"
              >
                Alert
              </button>
            )}
          </div>
        </div>

        {/* Pro Toolbar: Timeframes, Style & Indicator Cloud */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 bg-slate-50/70 dark:bg-[#181c27] border-b border-slate-200 dark:border-[#2a2e39] text-xs">
          {/* Timeframes */}
          <div className="flex items-center gap-0.5">
            {(['1D', '5D', '1M', '3M', '6M', '1Y', '5Y', 'ALL'] as TimeFrame[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2 py-0.5 font-semibold rounded text-[11px] transition-colors ${
                  timeframe === tf
                    ? 'bg-slate-900 dark:bg-[#2962ff] text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Style & Indicators */}
          <div className="flex items-center gap-2">
            {/* Chart Style */}
            <div className="flex items-center gap-0.5 p-0.5 bg-slate-200/60 dark:bg-[#222634] rounded text-[11px]">
              <button
                onClick={() => setChartType('candlestick')}
                className={`px-2 py-0.5 rounded font-medium ${
                  chartType === 'candlestick'
                    ? 'bg-white dark:bg-[#131722] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                Candles
              </button>
              <button
                onClick={() => setChartType('area')}
                className={`px-2 py-0.5 rounded font-medium ${
                  chartType === 'area'
                    ? 'bg-white dark:bg-[#131722] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                Area
              </button>
              <button
                onClick={() => setChartType('heikin-ashi')}
                className={`px-2 py-0.5 rounded font-medium ${
                  chartType === 'heikin-ashi'
                    ? 'bg-white dark:bg-[#131722] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                HA
              </button>
            </div>

            {/* Pro Indicators */}
            <div className="hidden sm:flex items-center gap-1 border-l border-slate-300 dark:border-[#2a2e39] pl-2 text-[11px]">
              <button
                onClick={() => setShowSMA20(!showSMA20)}
                className={`px-1.5 py-0.5 font-medium rounded ${
                  showSMA20
                    ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                SMA 20
              </button>
              <button
                onClick={() => setShowBollinger(!showBollinger)}
                className={`px-1.5 py-0.5 font-medium rounded ${
                  showBollinger
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Bollinger
              </button>
              <button
                onClick={() => setShowVWAP(!showVWAP)}
                className={`px-1.5 py-0.5 font-medium rounded ${
                  showVWAP
                    ? 'bg-pink-500/10 text-pink-400 border border-pink-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                VWAP
              </button>
              <button
                onClick={() => setSubPane(subPane === 'rsi' ? 'none' : 'rsi')}
                className={`px-1.5 py-0.5 font-medium rounded ${
                  subPane === 'rsi'
                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                RSI
              </button>
              <button
                onClick={() => setSubPane(subPane === 'macd' ? 'none' : 'macd')}
                className={`px-1.5 py-0.5 font-medium rounded ${
                  subPane === 'macd'
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                MACD
              </button>
            </div>
          </div>
        </div>

        {/* Canvas Viewport */}
        <div
          ref={containerRef}
          onWheel={handleWheel}
          className={`relative w-full ${isCompact ? 'h-[280px]' : 'h-[420px]'} cursor-crosshair select-none`}
        >
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => {
              setIsPanning(false);
              setHoverIndex(null);
              setMousePos(null);
            }}
            className="w-full h-full block"
          />
        </div>
      </div>
    </div>
  );
};
