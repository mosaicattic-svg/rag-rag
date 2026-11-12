import React, { useState } from 'react';
import { MarketItem } from '../types/market';
import { formatPercent, formatPrice } from '../utils/chartHelpers';
import { ArrowRightLeft, Globe, DollarSign } from 'lucide-react';

interface ForexScreenProps {
  items: MarketItem[];
  onSelectItem: (item: MarketItem) => void;
  onQuickTrade: (item: MarketItem, side: 'buy' | 'sell') => void;
}

export const ForexScreen: React.FC<ForexScreenProps> = ({
  items,
  onSelectItem,
  onQuickTrade,
}) => {
  const forexPairs = items.filter((i) => i.category === 'forex');

  // Currency Converter State
  const [calcAmount, setCalcAmount] = useState<number>(1000);
  const [calcPair, setCalcPair] = useState<string>('EURUSD');

  const activePair = forexPairs.find((p) => p.symbol === calcPair) || forexPairs[0];
  const convertedTotal = activePair ? calcAmount * activePair.price : 0;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="pb-2 border-b border-slate-200 dark:border-[#2a2e39]">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Forex & Currencies
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Global FX pairs, interbank spreads, pip dynamics, and exchange conversions
        </p>
      </div>

      {/* Currency Converter Quick Tool */}
      <div className="bg-white dark:bg-[#131722] border border-slate-200 dark:border-[#2a2e39] rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <ArrowRightLeft className="w-4 h-4 text-[#2962ff]" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Quick Currency Converter
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="text-slate-500 dark:text-slate-400 block mb-1">Amount</label>
            <input
              type="number"
              value={calcAmount}
              onChange={(e) => setCalcAmount(Math.max(1, Number(e.target.value)))}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1a1e29] border border-slate-200 dark:border-[#2a2e39] rounded-lg font-mono text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-slate-500 dark:text-slate-400 block mb-1">Currency Pair</label>
            <select
              value={calcPair}
              onChange={(e) => setCalcPair(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1a1e29] border border-slate-200 dark:border-[#2a2e39] rounded-lg font-mono text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {forexPairs.map((p) => (
                <option key={p.symbol} value={p.symbol}>
                  {p.symbol} ({p.name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-500 dark:text-slate-400 block mb-1">Converted Value</label>
            <div className="px-3 py-2 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg font-mono text-base font-bold text-[#2962ff] tabular-nums">
              {convertedTotal.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Forex Table */}
      <div className="bg-white dark:bg-[#131722] border border-slate-200 dark:border-[#2a2e39] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#181c27] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-[#2a2e39]">
              <tr>
                <th className="py-3 px-4 font-semibold">Pair</th>
                <th className="py-3 px-4 font-semibold text-right">Bid</th>
                <th className="py-3 px-4 font-semibold text-right">Ask</th>
                <th className="py-3 px-4 font-semibold text-right">Spread</th>
                <th className="py-3 px-4 font-semibold text-right">1D Change</th>
                <th className="py-3 px-4 font-semibold text-right hidden sm:table-cell">Day High</th>
                <th className="py-3 px-4 font-semibold text-right hidden sm:table-cell">Day Low</th>
                <th className="py-3 px-4 font-semibold text-center">Rating</th>
                <th className="py-3 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1e222d]">
              {forexPairs.map((pair) => {
                const isUp = pair.change >= 0;
                // Calculate bid/ask with 1.2 pip spread
                const spreadPips = 1.2;
                const spreadVal = pair.symbol.includes('JPY') ? 0.012 : 0.00012;
                const bid = pair.price - spreadVal / 2;
                const ask = pair.price + spreadVal / 2;

                return (
                  <tr
                    key={pair.symbol}
                    onClick={() => onSelectItem(pair)}
                    className="hover:bg-slate-50 dark:hover:bg-[#1a1f2c] transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-[#2962ff] flex items-center justify-center font-bold text-xs font-mono">
                          FX
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white font-mono group-hover:text-[#2962ff] transition-colors">
                            {pair.symbol}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {pair.name}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                      {formatPrice(bid, 'forex')}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                      {formatPrice(ask, 'forex')}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                      {spreadPips} pips
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                      <span
                        className={`font-semibold ${
                          isUp ? 'text-[#089981]' : 'text-[#f23645]'
                        }`}
                      >
                        {isUp ? '+' : ''}
                        {formatPrice(pair.change, 'forex')} ({formatPercent(pair.changePercent)})
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-slate-600 dark:text-slate-300 hidden sm:table-cell tabular-nums">
                      {formatPrice(pair.high, 'forex')}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-slate-600 dark:text-slate-300 hidden sm:table-cell tabular-nums">
                      {formatPrice(pair.low, 'forex')}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          pair.technicalRating.includes('Buy')
                            ? 'bg-[#089981]/10 text-[#089981]'
                            : pair.technicalRating.includes('Sell')
                            ? 'bg-[#f23645]/10 text-[#f23645]'
                            : 'bg-amber-500/10 text-amber-500'
                        }`}
                      >
                        {pair.technicalRating}
                      </span>
                    </td>

                    <td
                      className="py-3.5 px-4 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => onQuickTrade(pair, 'buy')}
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
