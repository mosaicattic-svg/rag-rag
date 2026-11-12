import React, { useState, useMemo } from 'react';
import { MarketItem } from '../types/market';
import { formatPercent, formatPrice } from '../utils/chartHelpers';
import { Filter, Download, RotateCcw, ArrowUpDown, Check } from 'lucide-react';

interface ScreenerViewProps {
  items: MarketItem[];
  onSelectItem: (item: MarketItem) => void;
  onQuickTrade: (item: MarketItem, side: 'buy' | 'sell') => void;
}

export const ScreenerView: React.FC<ScreenerViewProps> = ({
  items,
  onSelectItem,
  onQuickTrade,
}) => {
  // Screener Filters
  const [selectedSector, setSelectedSector] = useState<string>('All');
  const [selectedCapTier, setSelectedCapTier] = useState<string>('All');
  const [selectedRating, setSelectedRating] = useState<string>('All');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [sortBy, setSortBy] = useState<keyof MarketItem>('marketCapNum');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Available sectors
  const sectors = useMemo(() => {
    const list = ['All'];
    items.forEach((i) => {
      if (i.sector && !list.includes(i.sector)) list.push(i.sector);
    });
    return list;
  }, [items]);

  // Filtered dataset
  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (selectedSector !== 'All' && item.sector !== selectedSector) return false;
      if (selectedRating !== 'All' && item.technicalRating !== selectedRating) return false;

      // Cap Tier
      if (selectedCapTier === 'Mega (>200B)') {
        if (!item.marketCapNum || item.marketCapNum < 200e9) return false;
      } else if (selectedCapTier === 'Large (10B-200B)') {
        if (!item.marketCapNum || item.marketCapNum < 10e9 || item.marketCapNum > 200e9) return false;
      }

      // Min/Max price
      if (minPrice && item.price < parseFloat(minPrice)) return false;
      if (maxPrice && item.price > parseFloat(maxPrice)) return false;

      return true;
    }).sort((a, b) => {
      const valA = (a as any)[sortBy] ?? 0;
      const valB = (b as any)[sortBy] ?? 0;
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [items, selectedSector, selectedCapTier, selectedRating, minPrice, maxPrice, sortBy, sortAsc]);

  const handleResetFilters = () => {
    setSelectedSector('All');
    setSelectedCapTier('All');
    setSelectedRating('All');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('marketCapNum');
    setSortAsc(false);
  };

  const handleExportCSV = () => {
    const headers = ['Symbol', 'Name', 'Category', 'Price', 'Change%', 'Volume', 'MarketCap', 'Rating'];
    const rows = filtered.map((i) => [
      i.symbol,
      `"${i.name}"`,
      i.category,
      i.price,
      i.changePercent,
      i.volume,
      i.marketCap || '',
      i.technicalRating,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tradingview_screener_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-[#2a2e39]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Stock & Asset Screener
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Filter instruments by sector, valuation, technical ratings, and volatility
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetFilters}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1e222d] border border-slate-200 dark:border-[#2a2e39] rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#2962ff] hover:bg-[#1e53e5] rounded-lg transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white dark:bg-[#131722] border border-slate-200 dark:border-[#2a2e39] rounded-xl p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="text-slate-500 dark:text-slate-400 block mb-1.5 font-medium">Sector</label>
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1a1e29] border border-slate-200 dark:border-[#2a2e39] rounded-lg text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {sectors.map((sec) => (
                <option key={sec} value={sec}>{sec}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-500 dark:text-slate-400 block mb-1.5 font-medium">Market Capitalization</label>
            <select
              value={selectedCapTier}
              onChange={(e) => setSelectedCapTier(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1a1e29] border border-slate-200 dark:border-[#2a2e39] rounded-lg text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="All">All Capitalizations</option>
              <option value="Mega (>200B)">Mega Cap (&gt; $200B)</option>
              <option value="Large (10B-200B)">Large Cap ($10B - $200B)</option>
            </select>
          </div>

          <div>
            <label className="text-slate-500 dark:text-slate-400 block mb-1.5 font-medium">Technical Rating</label>
            <select
              value={selectedRating}
              onChange={(e) => setSelectedRating(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1a1e29] border border-slate-200 dark:border-[#2a2e39] rounded-lg text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="All">All Ratings</option>
              <option value="Strong Buy">Strong Buy</option>
              <option value="Buy">Buy</option>
              <option value="Neutral">Neutral</option>
              <option value="Sell">Sell</option>
            </select>
          </div>

          <div>
            <label className="text-slate-500 dark:text-slate-400 block mb-1.5 font-medium">Price Range ($)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-1/2 px-2.5 py-2 bg-slate-50 dark:bg-[#1a1e29] border border-slate-200 dark:border-[#2a2e39] rounded-lg text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-slate-400">-</span>
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-1/2 px-2.5 py-2 bg-slate-50 dark:bg-[#1a1e29] border border-slate-200 dark:border-[#2a2e39] rounded-lg text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white dark:bg-[#131722] border border-slate-200 dark:border-[#2a2e39] rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-[#2a2e39] text-xs font-semibold text-slate-500 dark:text-slate-400">
          Showing {filtered.length} matching instruments
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#181c27] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-[#2a2e39]">
              <tr>
                <th className="py-3 px-4 font-semibold">Symbol</th>
                <th className="py-3 px-4 font-semibold">Name</th>
                <th className="py-3 px-4 font-semibold text-right">Price</th>
                <th className="py-3 px-4 font-semibold text-right">Change %</th>
                <th className="py-3 px-4 font-semibold text-right">Volume</th>
                <th className="py-3 px-4 font-semibold text-right">Market Cap</th>
                <th className="py-3 px-4 font-semibold text-center">Rating</th>
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
                    <td className="py-3 px-4 font-bold font-mono text-slate-900 dark:text-white group-hover:text-[#2962ff]">
                      {item.symbol}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 truncate max-w-[180px]">
                      {item.name}
                    </td>
                    <td className="py-3 px-4 text-right font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                      {formatPrice(item.price, item.category)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums">
                      <span className={`font-semibold ${isUp ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                        {formatPercent(item.changePercent)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-slate-300">
                      {item.volume}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-slate-300">
                      {item.marketCap ? `$${item.marketCap}` : '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
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
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
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
