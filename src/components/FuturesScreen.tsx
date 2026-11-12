import React, { useState } from 'react';
import { MarketItem } from '../types/market';
import { formatPercent, formatPrice } from '../utils/chartHelpers';
import { Flame, Shield, TrendingUp, Compass } from 'lucide-react';

interface FuturesScreenProps {
  items: MarketItem[];
  onSelectItem: (item: MarketItem) => void;
  onQuickTrade: (item: MarketItem, side: 'buy' | 'sell') => void;
}

export const FuturesScreen: React.FC<FuturesScreenProps> = ({
  items,
  onSelectItem,
  onQuickTrade,
}) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'index' | 'commodity' | 'bond'>('all');

  const filtered = items.filter((i) => {
    const isFutureCategory = i.category === 'index' || i.category === 'commodity' || i.category === 'bond';
    if (!isFutureCategory) return false;
    if (activeCategory === 'all') return true;
    return i.category === activeCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-[#2a2e39]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Futures, Commodities & Bonds
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Global index futures, energy, metals, and sovereign yield benchmarks
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1 p-1 bg-white dark:bg-[#131722] border border-slate-200 dark:border-[#2a2e39] rounded-lg text-xs">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1 rounded-md font-semibold transition-colors ${
              activeCategory === 'all'
                ? 'bg-slate-900 dark:bg-[#2962ff] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            All Instruments
          </button>
          <button
            onClick={() => setActiveCategory('index')}
            className={`px-3 py-1 rounded-md font-semibold transition-colors ${
              activeCategory === 'index'
                ? 'bg-slate-900 dark:bg-[#2962ff] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            World Indices
          </button>
          <button
            onClick={() => setActiveCategory('commodity')}
            className={`px-3 py-1 rounded-md font-semibold transition-colors ${
              activeCategory === 'commodity'
                ? 'bg-slate-900 dark:bg-[#2962ff] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Commodities
          </button>
          <button
            onClick={() => setActiveCategory('bond')}
            className={`px-3 py-1 rounded-md font-semibold transition-colors ${
              activeCategory === 'bond'
                ? 'bg-slate-900 dark:bg-[#2962ff] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Bonds & Yields
          </button>
        </div>
      </div>

      {/* Instruments Table */}
      <div className="bg-white dark:bg-[#131722] border border-slate-200 dark:border-[#2a2e39] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#181c27] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-[#2a2e39]">
              <tr>
                <th className="py-3 px-4 font-semibold">Instrument</th>
                <th className="py-3 px-4 font-semibold text-right">Last Price</th>
                <th className="py-3 px-4 font-semibold text-right">Net Change</th>
                <th className="py-3 px-4 font-semibold text-right">% Change</th>
                <th className="py-3 px-4 font-semibold text-right hidden sm:table-cell">Day High</th>
                <th className="py-3 px-4 font-semibold text-right hidden sm:table-cell">Day Low</th>
                <th className="py-3 px-4 font-semibold text-center">Technical Rating</th>
                <th className="py-3 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1e222d]">
              {filtered.map((item) => {
                const isUp = item.change >= 0;
                return (
                  <tr
                    key={item.symbol}
                    onClick={() => onSelectItem(item)}
                    className="hover:bg-slate-50 dark:hover:bg-[#1a1f2c] transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#1e222d] text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs font-mono">
                          {item.category === 'index' ? 'IDX' : item.category === 'commodity' ? 'COM' : 'BND'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white font-mono group-hover:text-[#2962ff] transition-colors">
                            {item.symbol}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {item.name}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                      {formatPrice(item.price, item.category)}
                      {item.category === 'bond' && '%'}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                      <span
                        className={`font-semibold ${
                          isUp ? 'text-[#089981]' : 'text-[#f23645]'
                        }`}
                      >
                        {isUp ? '+' : ''}
                        {formatPrice(item.change, item.category)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                      <span
                        className={`font-semibold ${
                          isUp ? 'text-[#089981]' : 'text-[#f23645]'
                        }`}
                      >
                        {formatPercent(item.changePercent)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-slate-600 dark:text-slate-300 hidden sm:table-cell tabular-nums">
                      {formatPrice(item.high, item.category)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-slate-600 dark:text-slate-300 hidden sm:table-cell tabular-nums">
                      {formatPrice(item.low, item.category)}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          item.technicalRating.includes('Buy')
                            ? 'bg-[#089981]/10 text-[#089981]'
                            : item.technicalRating.includes('Sell')
                            ? 'bg-[#f23645]/10 text-[#f23645]'
                            : 'bg-amber-500/10 text-amber-500'
                        }`}
                      >
                        {item.technicalRating}
                      </span>
                    </td>

                    <td
                      className="py-3.5 px-4 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => onQuickTrade(item, 'buy')}
                        className="px-2.5 py-1 text-xs font-semibold text-white bg-[#089981] hover:bg-[#077d69] rounded transition-colors"
                      >
                        Trade
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
