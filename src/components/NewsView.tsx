import React, { useState } from 'react';
import { NewsItem, MarketItem } from '../types/market';
import { Clock, ExternalLink, TrendingUp, TrendingDown, Newspaper } from 'lucide-react';

interface NewsViewProps {
  news: NewsItem[];
  items: MarketItem[];
  onSelectSymbol: (symbol: string) => void;
}

export const NewsView: React.FC<NewsViewProps> = ({
  news,
  items,
  onSelectSymbol,
}) => {
  const [selectedCat, setSelectedCat] = useState<string>('All');

  const categories = ['All', 'Markets', 'Tech', 'Crypto', 'Macro'];

  const filteredNews = news.filter((n) => {
    if (selectedCat === 'All') return true;
    return n.category === selectedCat;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-[#2a2e39]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Financial News & Market Insights
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Breaking wire reports, macroeconomic forecasts, and earnings disclosures
          </p>
        </div>

        {/* Filter categories */}
        <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-[#131722] border border-slate-200 dark:border-[#2a2e39] rounded-lg text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                selectedCat === cat
                  ? 'bg-slate-900 dark:bg-[#2962ff] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* News Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredNews.map((item) => {
          return (
            <div
              key={item.id}
              className="bg-white dark:bg-[#131722] border border-slate-200 dark:border-[#2a2e39] rounded-xl p-5 shadow-sm flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {item.source}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {item.timeAgo}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      item.sentiment === 'Bullish'
                        ? 'bg-emerald-500/10 text-[#089981]'
                        : item.sentiment === 'Bearish'
                        ? 'bg-rose-500/10 text-[#f23645]'
                        : 'bg-slate-100 dark:bg-[#1e222d] text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {item.sentiment}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                  {item.title}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                  {item.summary}
                </p>
              </div>

              {/* Related Tickers */}
              <div className="flex flex-wrap items-center gap-1.5 mt-4 pt-3 border-t border-slate-100 dark:border-[#1e222d]">
                <span className="text-[11px] text-slate-400 font-medium">Related:</span>
                {item.relatedSymbols.map((sym) => {
                  const mItem = items.find((i) => i.symbol === sym);
                  return (
                    <button
                      key={sym}
                      onClick={() => onSelectSymbol(sym)}
                      className="px-2 py-0.5 rounded bg-slate-100 dark:bg-[#1e222d] hover:bg-blue-50 dark:hover:bg-blue-500/20 text-[#2962ff] text-xs font-mono font-bold transition-colors"
                    >
                      ${sym}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
