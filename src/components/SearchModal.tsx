import React, { useState, useEffect, useRef } from 'react';
import { MarketItem } from '../types/market';
import { formatPercent, formatPrice } from '../utils/chartHelpers';
import { Search, X, Star, Check } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: MarketItem[];
  onSelectItem: (item: MarketItem) => void;
  watchlistSymbols: string[];
  onToggleWatchlist: (symbol: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  items,
  onSelectItem,
  watchlistSymbols,
  onToggleWatchlist,
}) => {
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredItems = items.filter((item) => {
    const matchesCat = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesQuery =
      item.symbol.toLowerCase().includes(query.toLowerCase()) ||
      item.name.toLowerCase().includes(query.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-xs">
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#1e222d] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#2a2e39] overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Box */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 dark:border-[#2a2e39] gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search symbol, currency, or company name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2 py-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-[#2a2e39] rounded"
          >
            ESC
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 px-4 py-2 bg-slate-50 dark:bg-[#181c27] border-b border-slate-200 dark:border-[#2a2e39] overflow-x-auto no-scrollbar text-xs">
          {[
            { id: 'all', label: 'All Instruments' },
            { id: 'stock', label: 'Stocks' },
            { id: 'crypto', label: 'Crypto' },
            { id: 'forex', label: 'Forex' },
            { id: 'index', label: 'Indices' },
            { id: 'commodity', label: 'Commodities' },
            { id: 'bond', label: 'Bonds' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
                categoryFilter === cat.id
                  ? 'bg-slate-900 dark:bg-[#2962ff] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Results List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-[#2a2e39]/50">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No matching instruments found for "{query}"
            </div>
          ) : (
            filteredItems.map((item) => {
              const isUp = item.change >= 0;
              const isWatchlisted = watchlistSymbols.includes(item.symbol);

              return (
                <div
                  key={item.symbol}
                  onClick={() => {
                    onSelectItem(item);
                    onClose();
                  }}
                  className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-[#252a37] transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleWatchlist(item.symbol);
                      }}
                      className={`p-1 rounded hover:bg-slate-200 dark:hover:bg-[#2e3444] transition-colors ${
                        isWatchlisted ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'
                      }`}
                      title={isWatchlisted ? 'In Watchlist' : 'Add to Watchlist'}
                    >
                      <Star className="w-4 h-4 fill-current" />
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white font-mono text-sm group-hover:text-[#2962ff]">
                          {item.symbol}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-[#2a2e39] text-slate-500 font-medium uppercase">
                          {item.exchange}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[280px]">
                        {item.name}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold font-mono text-slate-900 dark:text-white text-xs tabular-nums">
                      {formatPrice(item.price, item.category)}
                    </div>
                    <div
                      className={`text-[11px] font-semibold font-mono tabular-nums ${
                        isUp ? 'text-[#089981]' : 'text-[#f23645]'
                      }`}
                    >
                      {formatPercent(item.changePercent)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
