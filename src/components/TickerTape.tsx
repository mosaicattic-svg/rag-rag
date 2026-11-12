import React from 'react';
import { MarketItem } from '../types/market';
import { formatPercent, formatPrice } from '../utils/chartHelpers';

interface TickerTapeProps {
  items: MarketItem[];
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
}

export const TickerTape: React.FC<TickerTapeProps> = ({
  items,
  selectedSymbol,
  onSelectSymbol,
}) => {
  // Sparkline mini SVG renderer
  const renderSparkline = (points: number[], isUp: boolean) => {
    if (!points || points.length < 2) return null;
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    const h = 18;
    const w = 48;

    const pathData = points
      .map((p, i) => {
        const x = (i / (points.length - 1)) * w;
        const y = h - ((p - min) / range) * (h - 4) - 2;
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');

    return (
      <svg width={w} height={h} className="shrink-0">
        <path
          d={pathData}
          fill="none"
          stroke={isUp ? '#089981' : '#f23645'}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  return (
    <div className="w-full bg-slate-900 dark:bg-[#131722] border-b border-slate-800 dark:border-[#2a2e39] text-xs select-none overflow-hidden relative">
      <div className="flex items-center overflow-x-auto no-scrollbar py-2 px-4 gap-6 scroll-smooth">
        {items.map((item) => {
          const isUp = item.change >= 0;
          const isSelected = item.symbol === selectedSymbol;

          return (
            <button
              key={item.symbol}
              onClick={() => onSelectSymbol(item.symbol)}
              className={`flex items-center gap-3 shrink-0 px-2.5 py-1 rounded-md transition-colors ${
                isSelected
                  ? 'bg-slate-800 dark:bg-[#202533] ring-1 ring-blue-500/50'
                  : 'hover:bg-slate-800/60 dark:hover:bg-[#1a1f2c]'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white font-mono tracking-tight">
                  {item.symbol}
                </span>
                <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                  {formatPrice(item.price, item.category)}
                </span>
              </div>

              <div
                className={`text-[11px] font-semibold font-mono tabular-nums flex items-center ${
                  isUp ? 'text-[#089981]' : 'text-[#f23645]'
                }`}
              >
                {formatPercent(item.changePercent)}
              </div>

              {renderSparkline(item.sparkline, isUp)}
            </button>
          );
        })}
      </div>
    </div>
  );
};
