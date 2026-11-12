import React, { useState, useMemo } from 'react';
import { MarketItem } from '../types/market';
import { formatPercent, formatPrice } from '../utils/chartHelpers';
import { Search, ArrowUpDown, Filter, ChevronRight } from 'lucide-react';

interface StockScreenProps {
  items: MarketItem[];
  onSelectItem: (item: MarketItem) => void;
  onQuickTrade: (item: MarketItem, side: 'buy' | 'sell') => void;
}

export const StockScreen: React.FC<StockScreenProps> = ({
  items,
  onSelectItem,
  onQuickTrade,
}) => {
  const [selectedSector, setSelectedSector] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'marketCap' | 'change' | 'volume' | 'pe'>('marketCap');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const stocks = useMemo(() => {
    return items.filter((i) => i.category === 'stock');
  }, [items]);

  const sectors = useMemo(() => {
    const list = ['All'];
    stocks.forEach((s) => {
      if (s.sector && !list.includes(s.sector)) {
        list.push(s.sector);
      }
    });
    return list;
  }, [stocks]);

  const filteredStocks = useMemo(() => {
    return stocks
      .filter((s) => {
        const matchesSector = selectedSector === 'All' || s.sector === selectedSector;
        const matchesQuery =
          s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSector && matchesQuery;
      })
      .sort((a, b) => {
        let valA = 0;
        let valB = 0;
        if (sortBy === 'marketCap') {
          valA = a.marketCapNum || 0;
          valB = b.marketCapNum || 0;
        } else if (sortBy === 'change') {
          valA = a.changePercent;
          valB = b.changePercent;
        } else if (sortBy === 'volume') {
          valA = a.volumeNum;
          valB = b.volumeNum;
        } else if (sortBy === 'pe') {
          valA = a.peRatio || 0;
          valB = b.peRatio || 0;
        }
        return sortOrder === 'desc' ? valB - valA : valA - valB;
      });
  }, [stocks, selectedSector, searchQuery, sortBy, sortOrder]);

  const toggleSort = (field: 'marketCap' | 'change' | 'volume' | 'pe') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-5">
      {/* Page Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-[#2a2e39]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Stocks Screener
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track mega-cap leaders, volume spikes, and sector momentum
          </p>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search stock symbol..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-white dark:bg-[#131722] border border-slate-200 dark:border-[#2a2e39] rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Sector filter tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {sectors.map((sec) => (
          <button
            key={sec}
            onClick={() => setSelectedSector(sec)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
              selectedSector === sec
                ? 'bg-slate-900 dark:bg-[#2962ff] text-white shadow-xs'
                : 'bg-white dark:bg-[#131722] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-[#2a2e39]'
            }`}
          >
            {sec}
          </button>
        ))}
      </div>

      {/* Main Stock Table */}
      <div className="bg-white dark:bg-[#131722] border border-slate-200 dark:border-[#2a2e39] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#181c27] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-[#2a2e39]">
              <tr>
                <th className="py-3 px-4 font-semibold">Symbol & Name</th>
                <th className="py-3 px-4 font-semibold text-right">Price</th>
                <th
                  className="py-3 px-4 font-semibold text-right cursor-pointer hover:text-slate-900 dark:hover:text-white"
                  onClick={() => toggleSort('change')}
                >
                  <div className="inline-flex items-center gap-1">
                    <span>1D Change</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  className="py-3 px-4 font-semibold text-right cursor-pointer hover:text-slate-900 dark:hover:text-white"
                  onClick={() => toggleSort('volume')}
                >
                  <div className="inline-flex items-center gap-1">
                    <span>Volume</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  className="py-3 px-4 font-semibold text-right cursor-pointer hover:text-slate-900 dark:hover:text-white hidden md:table-cell"
                  onClick={() => toggleSort('marketCap')}
                >
                  <div className="inline-flex items-center gap-1">
                    <span>Market Cap</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  className="py-3 px-4 font-semibold text-right hidden lg:table-cell cursor-pointer hover:text-slate-900 dark:hover:text-white"
                  onClick={() => toggleSort('pe')}
                >
                  <div className="inline-flex items-center gap-1">
                    <span>P/E Ratio</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 font-semibold text-center hidden sm:table-cell">
                  Rating
                </th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1e222d]">
              {filteredStocks.map((stock) => {
                const isUp = stock.change >= 0;
                return (
                  <tr
                    key={stock.symbol}
                    className="hover:bg-slate-50 dark:hover:bg-[#1a1f2c] transition-colors group cursor-pointer"
                    onClick={() => onSelectItem(stock)}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-[#1e222d] flex items-center justify-center font-bold text-[11px] text-[#2962ff] font-mono">
                          {stock.symbol.slice(0, 3)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white font-mono group-hover:text-[#2962ff] transition-colors">
                            {stock.symbol}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[140px] sm:max-w-[200px]">
                            {stock.name}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                      ${formatPrice(stock.price)}
                    </td>

                    <td className="py-3 px-4 text-right font-mono tabular-nums">
                      <span
                        className={`font-semibold ${
                          isUp ? 'text-[#089981]' : 'text-[#f23645]'
                        }`}
                      >
                        {isUp ? '+' : ''}
                        {formatPrice(stock.change)} ({formatPercent(stock.changePercent)})
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">
                      {stock.volume}
                    </td>

                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300 hidden md:table-cell">
                      ${stock.marketCap}
                    </td>

                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300 hidden lg:table-cell">
                      {stock.peRatio || '-'}
                    </td>

                    <td className="py-3 px-4 text-center hidden sm:table-cell">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          stock.technicalRating.includes('Buy')
                            ? 'bg-[#089981]/10 text-[#089981]'
                            : stock.technicalRating.includes('Sell')
                            ? 'bg-[#f23645]/10 text-[#f23645]'
                            : 'bg-amber-500/10 text-amber-500'
                        }`}
                      >
                        {stock.technicalRating}
                      </span>
                    </td>

                    <td
                      className="py-3 px-4 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => onQuickTrade(stock, 'buy')}
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
