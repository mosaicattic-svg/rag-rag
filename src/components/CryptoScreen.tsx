import React, { useState } from 'react';
import { MarketItem } from '../types/market';
import { formatPercent, formatPrice } from '../utils/chartHelpers';
import { TrendingUp, Flame, Shield, Coins, Search } from 'lucide-react';

interface CryptoScreenProps {
  items: MarketItem[];
  onSelectItem: (item: MarketItem) => void;
  onQuickTrade: (item: MarketItem, side: 'buy' | 'sell') => void;
}

export const CryptoScreen: React.FC<CryptoScreenProps> = ({
  items,
  onSelectItem,
  onQuickTrade,
}) => {
  const [search, setSearch] = useState('');

  const cryptos = items.filter((i) => i.category === 'crypto');
  const filtered = cryptos.filter(
    (c) =>
      c.symbol.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Title & Fear and Greed Index Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-[#2a2e39]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Crypto Market Overview
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time digital asset quotes, DeFi metrics, and market capitalization
          </p>
        </div>

        {/* Global Crypto Metrics Strip */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#131722] border border-slate-200 dark:border-[#2a2e39]">
            <span className="text-slate-400">Total Market Cap: </span>
            <span className="font-bold text-slate-900 dark:text-white">$3.14T</span>
            <span className="text-[#089981] ml-1 font-semibold">+2.8%</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#131722] border border-slate-200 dark:border-[#2a2e39]">
            <span className="text-slate-400">BTC Dominance: </span>
            <span className="font-bold text-slate-900 dark:text-white">58.6%</span>
          </div>
          {/* Fear & Greed Index */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[#089981]">
            <Flame className="w-3.5 h-3.5" />
            <span className="font-bold">Greed (78)</span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search crypto symbol (e.g. BTC, ETH, SOL)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-white dark:bg-[#131722] border border-slate-200 dark:border-[#2a2e39] rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Crypto Table */}
      <div className="bg-white dark:bg-[#131722] border border-slate-200 dark:border-[#2a2e39] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#181c27] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-[#2a2e39]">
              <tr>
                <th className="py-3 px-4 font-semibold">Asset</th>
                <th className="py-3 px-4 font-semibold text-right">Price</th>
                <th className="py-3 px-4 font-semibold text-right">24h Change</th>
                <th className="py-3 px-4 font-semibold text-right">24h Volume</th>
                <th className="py-3 px-4 font-semibold text-right hidden md:table-cell">Market Cap</th>
                <th className="py-3 px-4 font-semibold text-center hidden sm:table-cell">Technical Rating</th>
                <th className="py-3 px-4 font-semibold text-right">Trade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1e222d]">
              {filtered.map((coin) => {
                const isUp = coin.change >= 0;
                return (
                  <tr
                    key={coin.symbol}
                    onClick={() => onSelectItem(coin)}
                    className="hover:bg-slate-50 dark:hover:bg-[#1a1f2c] transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-xs font-mono">
                          {coin.symbol.slice(0, 3)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white font-mono group-hover:text-[#2962ff] transition-colors">
                            {coin.symbol}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {coin.name}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                      ${formatPrice(coin.price, coin.category)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                      <span
                        className={`font-semibold ${
                          isUp ? 'text-[#089981]' : 'text-[#f23645]'
                        }`}
                      >
                        {isUp ? '+' : ''}
                        {formatPrice(coin.change, coin.category)} ({formatPercent(coin.changePercent)})
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">
                      ${coin.volume}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300 hidden md:table-cell">
                      ${coin.marketCap}
                    </td>

                    <td className="py-3.5 px-4 text-center hidden sm:table-cell">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          coin.technicalRating.includes('Buy')
                            ? 'bg-[#089981]/10 text-[#089981]'
                            : coin.technicalRating.includes('Sell')
                            ? 'bg-[#f23645]/10 text-[#f23645]'
                            : 'bg-amber-500/10 text-amber-500'
                        }`}
                      >
                        {coin.technicalRating}
                      </span>
                    </td>

                    <td
                      className="py-3.5 px-4 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => onQuickTrade(coin, 'buy')}
                        className="px-3 py-1 text-xs font-semibold text-white bg-[#089981] hover:bg-[#077d69] rounded transition-colors"
                      >
                        Buy
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
