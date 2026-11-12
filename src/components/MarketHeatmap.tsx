import React, { useState, useMemo } from 'react';
import { MarketItem } from '../types/market';
import { formatPercent, formatPrice } from '../utils/chartHelpers';
import { LayoutGrid, Layers, Filter } from 'lucide-react';

interface MarketHeatmapProps {
  items: MarketItem[];
  onSelectItem: (item: MarketItem) => void;
}

export const MarketHeatmap: React.FC<MarketHeatmapProps> = ({
  items,
  onSelectItem,
}) => {
  const [heatmapType, setHeatmapType] = useState<'stocks' | 'crypto'>('stocks');
  const [hoveredItem, setHoveredItem] = useState<MarketItem | null>(null);

  // Filter items by type and ensure marketCap exists
  const dataset = useMemo(() => {
    return items
      .filter((i) => (heatmapType === 'stocks' ? i.category === 'stock' : i.category === 'crypto'))
      .sort((a, b) => (b.marketCapNum || 0) - (a.marketCapNum || 0));
  }, [items, heatmapType]);

  // Total market cap for relative sizing
  const totalWeight = useMemo(() => {
    return dataset.reduce((sum, item) => sum + Math.sqrt(item.marketCapNum || 1000000), 0);
  }, [dataset]);

  // Color gradient function matching TradingView's heatmap palette
  const getTileColor = (pct: number) => {
    if (pct >= 4) return 'bg-[#089981] text-white';
    if (pct >= 2) return 'bg-[#10b981] text-white';
    if (pct > 0) return 'bg-[#34d399]/40 text-slate-900 dark:text-emerald-300 border border-emerald-500/30';
    if (pct === 0) return 'bg-slate-200 dark:bg-[#2a2e39] text-slate-700 dark:text-slate-300';
    if (pct > -2) return 'bg-[#f87171]/40 text-slate-900 dark:text-rose-300 border border-rose-500/30';
    if (pct > -4) return 'bg-[#ef4444] text-white';
    return 'bg-[#dc2626] text-white';
  };

  return (
    <div className="space-y-6">
      {/* Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-[#2a2e39]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Market Heatmap
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Treemap visualization sized by market capitalization and color-coded by daily performance
          </p>
        </div>

        {/* Heatmap Type Switcher */}
        <div className="flex items-center gap-1 p-1 bg-white dark:bg-[#131722] border border-slate-200 dark:border-[#2a2e39] rounded-lg text-xs">
          <button
            onClick={() => setHeatmapType('stocks')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
              heatmapType === 'stocks'
                ? 'bg-slate-900 dark:bg-[#2962ff] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            S&P 500 & US Stocks
          </button>
          <button
            onClick={() => setHeatmapType('crypto')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
              heatmapType === 'crypto'
                ? 'bg-slate-900 dark:bg-[#2962ff] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Crypto Market
          </button>
        </div>
      </div>

      {/* Legend Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-2.5 bg-white dark:bg-[#131722] border border-slate-200 dark:border-[#2a2e39] rounded-xl text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 dark:text-slate-400 font-medium">Performance:</span>
          <div className="flex items-center gap-1 text-[11px] font-mono font-semibold">
            <span className="px-1.5 py-0.5 rounded bg-[#dc2626] text-white">&lt; -4%</span>
            <span className="px-1.5 py-0.5 rounded bg-[#ef4444] text-white">-2%</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-[#2a2e39] text-slate-600 dark:text-slate-300">0%</span>
            <span className="px-1.5 py-0.5 rounded bg-[#10b981] text-white">+2%</span>
            <span className="px-1.5 py-0.5 rounded bg-[#089981] text-white">&gt; +4%</span>
          </div>
        </div>

        {hoveredItem && (
          <div className="text-xs font-mono">
            <span className="font-bold text-slate-900 dark:text-white">{hoveredItem.symbol}: </span>
            <span className="text-slate-600 dark:text-slate-300">
              ${formatPrice(hoveredItem.price, hoveredItem.category)}
            </span>{' '}
            <span
              className={`font-bold ${
                hoveredItem.change >= 0 ? 'text-[#089981]' : 'text-[#f23645]'
              }`}
            >
              ({formatPercent(hoveredItem.changePercent)})
            </span>{' '}
            <span className="text-slate-400">· Cap: ${hoveredItem.marketCap}</span>
          </div>
        )}
      </div>

      {/* Treemap Grid Container */}
      <div className="bg-white dark:bg-[#131722] border border-slate-200 dark:border-[#2a2e39] rounded-xl p-3 min-h-[460px] shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 h-full">
          {dataset.map((item, idx) => {
            // Give top 2 items larger tile spans for visual weight
            const colSpan = idx === 0 ? 'col-span-2 row-span-2 sm:col-span-2 sm:row-span-2' : idx === 1 ? 'col-span-2 sm:col-span-2' : 'col-span-1';
            const colorClass = getTileColor(item.changePercent);

            return (
              <div
                key={item.symbol}
                onClick={() => onSelectItem(item)}
                onMouseEnter={() => setHoveredItem(item)}
                onMouseLeave={() => setHoveredItem(null)}
                className={`${colSpan} ${colorClass} p-4 rounded-xl flex flex-col justify-between cursor-pointer transition-transform hover:scale-[1.01] shadow-xs select-none`}
              >
                <div className="flex items-start justify-between">
                  <div className="font-extrabold text-base sm:text-lg font-mono tracking-tight">
                    {item.symbol}
                  </div>
                  <div className="text-[11px] font-mono opacity-80">
                    ${item.marketCap}
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-xs font-mono opacity-90 truncate max-w-[120px]">
                    {item.name}
                  </div>
                  <div className="text-sm font-extrabold font-mono tabular-nums mt-0.5">
                    {formatPercent(item.changePercent)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
