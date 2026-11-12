import React from 'react';
import { AssetCategory } from '../types/market';
import {
  Search,
  Bookmark,
  Sun,
  Moon,
  TrendingUp,
  Globe,
  SlidersHorizontal,
} from 'lucide-react';

interface HeaderProps {
  currentCategory: AssetCategory;
  onSelectCategory: (cat: AssetCategory) => void;
  onOpenSearch: () => void;
  onToggleWatchlist: () => void;
  watchlistCount: number;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  isSimulating: boolean;
  onToggleSimulation: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentCategory,
  onSelectCategory,
  onOpenSearch,
  onToggleWatchlist,
  watchlistCount,
  theme,
  onToggleTheme,
  isSimulating,
  onToggleSimulation,
}) => {
  const navTabs: { id: AssetCategory; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'stocks', label: 'Stocks' },
    { id: 'crypto', label: 'Crypto' },
    { id: 'forex', label: 'Forex' },
    { id: 'futures', label: 'Futures & Bonds' },
    { id: 'heatmap', label: 'Heatmap' },
    { id: 'screener', label: 'Screener' },
    { id: 'news', label: 'News' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#131722]/95 backdrop-blur border-b border-slate-200 dark:border-[#2a2e39] transition-colors">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4 md:gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onSelectCategory('overview')}
            className="flex items-center gap-2 text-left group"
          >
            <div className="w-8 h-8 rounded-lg bg-[#2962ff] flex items-center justify-center text-white shadow-xs group-hover:bg-[#1e53e5] transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M3 17L9 11L13 15L21 7"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="21" cy="7" r="1.5" fill="currentColor" />
              </svg>
            </div>
            <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
              TradingView <span className="font-semibold text-slate-400 dark:text-slate-500 text-sm">Markets</span>
            </span>
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2 overflow-x-auto no-scrollbar">
          {navTabs.map((tab) => {
            const isActive = currentCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectCategory(tab.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition-colors ${
                  isActive
                    ? 'text-[#2962ff] bg-blue-50/70 dark:bg-blue-500/10'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1e222d]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Search, Utilities & Primary Action */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Symbol Search Trigger */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-[#1e222d] hover:bg-slate-200/70 dark:hover:bg-[#282d3c] border border-slate-200 dark:border-[#2a2e39] rounded-lg transition-colors whitespace-nowrap"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Search market (Ctrl+K)</span>
            <span className="sm:hidden">Search</span>
          </button>

          {/* Real-time simulation toggle button */}
          <button
            onClick={onToggleSimulation}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              isSimulating
                ? 'bg-emerald-500/10 border-emerald-500/30 text-[#089981]'
                : 'bg-slate-100 dark:bg-[#1e222d] border-slate-200 dark:border-[#2a2e39] text-slate-500'
            }`}
            title={isSimulating ? 'Live Market Ticks Active' : 'Market Ticks Paused'}
          >
            <span className="w-2 h-2 rounded-full bg-current shrink-0" />
            <span>{isSimulating ? 'Live' : 'Paused'}</span>
          </button>

          {/* Watchlist Toggle */}
          <button
            onClick={onToggleWatchlist}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-[#1e222d] hover:bg-slate-200/70 dark:hover:bg-[#282d3c] border border-slate-200 dark:border-[#2a2e39] rounded-lg transition-colors relative"
            title="Open Watchlist"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Watchlist</span>
            {watchlistCount > 0 && (
              <span className="px-1.5 py-0.2 bg-[#2962ff] text-white text-[10px] font-bold rounded-full">
                {watchlistCount}
              </span>
            )}
          </button>

          {/* Theme Switcher */}
          <button
            onClick={onToggleTheme}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1e222d] border border-slate-200 dark:border-[#2a2e39] rounded-lg transition-colors"
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          {/* Primary Action Button */}
          <button
            onClick={onOpenSearch}
            className="hidden sm:inline-flex px-4 py-1.5 text-xs font-semibold text-white bg-[#2962ff] hover:bg-[#1e53e5] rounded-lg transition-colors shadow-xs whitespace-nowrap shrink-0"
          >
            Trade Now
          </button>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="flex lg:hidden items-center overflow-x-auto no-scrollbar px-4 py-2 bg-slate-50 dark:bg-[#181c27] border-t border-slate-200 dark:border-[#2a2e39] gap-2">
        {navTabs.map((tab) => {
          const isActive = currentCategory === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectCategory(tab.id)}
              className={`px-3 py-1 text-xs font-semibold rounded-md whitespace-nowrap transition-colors ${
                isActive
                  ? 'text-white bg-[#2962ff]'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-[#222634]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
