import React, { useState } from 'react';
import { MarketItem, SectorPerformance, NewsItem, LayoutMode } from '../types/market';
import { InteractiveChart } from './InteractiveChart';
import { TechnicalGauge } from './TechnicalGauge';
import { OrderBookDOM } from './OrderBookDOM';
import { formatPercent, formatPrice } from '../utils/chartHelpers';
import {
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Layers,
  LayoutGrid,
} from 'lucide-react';

interface MarketOverviewProps {
  items: MarketItem[];
  selectedItem: MarketItem;
  onSelectItem: (item: MarketItem) => void;
  sectors: SectorPerformance[];
  news: NewsItem[];
  theme: 'dark' | 'light';
  onQuickTrade: (item: MarketItem, side: 'buy' | 'sell') => void;
  onSetAlert: (item: MarketItem) => void;
  onSelectCategory: (cat: any) => void;
}

export const MarketOverview: React.FC<MarketOverviewProps> = ({
  items,
  selectedItem,
  onSelectItem,
  sectors,
  news,
  theme,
  onQuickTrade,
  onSetAlert,
  onSelectCategory,
}) => {
  const [moverTab, setMoverTab] = useState<'gainers' | 'losers' | 'active'>('gainers');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('1x1');

  // Key hero benchmark cards
  const benchmarkSymbols = ['SPX', 'NDX', 'BTCUSDT', 'XAUUSD', 'USOIL'];
  const benchmarkItems = benchmarkSymbols
    .map((sym) => items.find((i) => i.symbol === sym))
    .filter(Boolean) as MarketItem[];

  // Secondary items for 2x1 and 2x2 split views
  const item2 = items.find((i) => i.symbol === 'BTCUSDT') || items[1];
  const item3 = items.find((i) => i.symbol === 'SPX') || items[2];
  const item4 = items.find((i) => i.symbol === 'AAPL') || items[3];

  // Sorted movers
  const gainers = [...items].sort((a, b) => b.changePercent - a.changePercent).slice(0, 5);
  const losers = [...items].sort((a, b) => a.changePercent - b.changePercent).slice(0, 5);
  const mostActive = [...items].sort((a, b) => b.volumeNum - a.volumeNum).slice(0, 5);

  const currentMovers = moverTab === 'gainers' ? gainers : moverTab === 'losers' ? losers : mostActive;

  return (
    <div className="space-y-6">
      {/* Page Header & Global Trading Sessions Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-[#2a2e39]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Markets Pro Terminal
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Institutional charting, Level-2 order book depth, and macroeconomic breadth
          </p>
        </div>

        {/* Global Market Session Statuses */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-500/10 text-[#089981] border border-emerald-500/20 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#089981] animate-pulse" />
            <span>US Markets Open</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-100 dark:bg-[#1e222d] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-[#2a2e39]">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <span>Europe Closed</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-500/10 text-[#089981] border border-emerald-500/20 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#089981]" />
            <span>Crypto 24/7</span>
          </div>
        </div>
      </div>

      {/* Hero Benchmark Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {benchmarkItems.map((bench) => {
          const isUp = bench.change >= 0;
          const isSelected = selectedItem.symbol === bench.symbol;
          return (
            <button
              key={bench.symbol}
              onClick={() => onSelectItem(bench)}
              className={`p-4 rounded-xl text-left transition-all ${
                isSelected
                  ? 'bg-blue-50/80 dark:bg-[#1a2336] border-2 border-[#2962ff] shadow-sm'
                  : 'bg-white dark:bg-[#131722] hover:bg-slate-50 dark:hover:bg-[#1c212d] border border-slate-200 dark:border-[#2a2e39]'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                  {bench.symbol}
                </span>
                <span className="truncate max-w-[90px]">{bench.exchange}</span>
              </div>
              <div className="text-lg font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
                {formatPrice(bench.price, bench.category)}
              </div>
              <div
                className={`text-xs font-semibold font-mono tabular-nums flex items-center gap-1 mt-1 ${
                  isUp ? 'text-[#089981]' : 'text-[#f23645]'
                }`}
              >
                {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                <span>
                  {isUp ? '+' : ''}
                  {formatPrice(bench.change, bench.category)} ({formatPercent(bench.changePercent)})
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* CHART VIEWPORTS: SINGLE, 2X1 SPLIT, OR 2X2 QUAD VIEW */}
      {layoutMode === '1x1' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-4">
            <InteractiveChart
              item={selectedItem}
              theme={theme}
              onQuickTrade={onQuickTrade}
              onSetAlert={onSetAlert}
              layoutMode={layoutMode}
              onChangeLayout={setLayoutMode}
            />
          </div>

          <div className="space-y-6">
            {/* L2 Order Book Depth */}
            <OrderBookDOM item={selectedItem} onQuickTrade={onQuickTrade} />

            {/* TradingView Speedometer Gauge */}
            <TechnicalGauge item={selectedItem} />
          </div>
        </div>
      )}

      {layoutMode === '2x1' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Dual Chart Split (Synchronized Ticks)
            </span>
            <button
              onClick={() => setLayoutMode('1x1')}
              className="text-xs text-[#2962ff] font-semibold hover:underline"
            >
              Reset to 1x1
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <InteractiveChart
              item={selectedItem}
              theme={theme}
              onQuickTrade={onQuickTrade}
              onSetAlert={onSetAlert}
              layoutMode={layoutMode}
              onChangeLayout={setLayoutMode}
              isCompact
            />
            <InteractiveChart
              item={item2}
              theme={theme}
              onQuickTrade={onQuickTrade}
              onSetAlert={onSetAlert}
              layoutMode={layoutMode}
              onChangeLayout={setLayoutMode}
              isCompact
            />
          </div>
        </div>
      )}

      {layoutMode === '2x2' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Quad 4-Chart Grid (Multi-Asset Real-Time Streaming)
            </span>
            <button
              onClick={() => setLayoutMode('1x1')}
              className="text-xs text-[#2962ff] font-semibold hover:underline"
            >
              Reset to 1x1
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InteractiveChart
              item={selectedItem}
              theme={theme}
              onQuickTrade={onQuickTrade}
              onSetAlert={onSetAlert}
              layoutMode={layoutMode}
              onChangeLayout={setLayoutMode}
              isCompact
            />
            <InteractiveChart
              item={item2}
              theme={theme}
              onQuickTrade={onQuickTrade}
              onSetAlert={onSetAlert}
              layoutMode={layoutMode}
              onChangeLayout={setLayoutMode}
              isCompact
            />
            <InteractiveChart
              item={item3}
              theme={theme}
              onQuickTrade={onQuickTrade}
              onSetAlert={onSetAlert}
              layoutMode={layoutMode}
              onChangeLayout={setLayoutMode}
              isCompact
            />
            <InteractiveChart
              item={item4}
              theme={theme}
              onQuickTrade={onQuickTrade}
              onSetAlert={onSetAlert}
              layoutMode={layoutMode}
              onChangeLayout={setLayoutMode}
              isCompact
            />
          </div>
        </div>
      )}

      {/* Market Movers & Sector Breadth */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {/* Movers Card */}
        <div className="bg-white dark:bg-[#131722] border border-slate-200 dark:border-[#2a2e39] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#2a2e39]">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Market Movers
            </h3>
            <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-[#1e222d] rounded-lg text-xs">
              <button
                onClick={() => setMoverTab('gainers')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  moverTab === 'gainers'
                    ? 'bg-white dark:bg-[#2962ff] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Top Gainers
              </button>
              <button
                onClick={() => setMoverTab('losers')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  moverTab === 'losers'
                    ? 'bg-white dark:bg-[#2962ff] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Top Losers
              </button>
              <button
                onClick={() => setMoverTab('active')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  moverTab === 'active'
                    ? 'bg-white dark:bg-[#2962ff] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Most Active
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-[#1e222d] mt-2">
            {currentMovers.map((m) => {
              const isUp = m.change >= 0;
              return (
                <div
                  key={m.symbol}
                  onClick={() => onSelectItem(m)}
                  className="flex items-center justify-between py-2.5 px-2 hover:bg-slate-50 dark:hover:bg-[#1a1f2c] rounded-lg cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm text-slate-900 dark:text-white font-mono">
                      {m.symbol}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
                      {m.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold font-mono text-slate-900 dark:text-white tabular-nums">
                      {formatPrice(m.price, m.category)}
                    </div>
                    <div
                      className={`text-xs font-semibold font-mono tabular-nums ${
                        isUp ? 'text-[#089981]' : 'text-[#f23645]'
                      }`}
                    >
                      {formatPercent(m.changePercent)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sector Heatmap Strip */}
        <div className="bg-white dark:bg-[#131722] border border-slate-200 dark:border-[#2a2e39] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#2a2e39]">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                US Sector Performance
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Daily relative returns</p>
            </div>
            <button
              onClick={() => onSelectCategory('heatmap')}
              className="text-xs font-semibold text-[#2962ff] hover:underline flex items-center gap-1"
            >
              Open Heatmap <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5 mt-3">
            {sectors.map((sec) => {
              const isPos = sec.changePercent >= 0;
              return (
                <div key={sec.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {sec.name}
                    </span>
                    <span
                      className={`font-semibold font-mono tabular-nums ${
                        isPos ? 'text-[#089981]' : 'text-[#f23645]'
                      }`}
                    >
                      {formatPercent(sec.changePercent)}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-[#1e222d] rounded-full overflow-hidden flex">
                    <div
                      className={`h-full rounded-full ${
                        isPos ? 'bg-[#089981]' : 'bg-[#f23645]'
                      }`}
                      style={{
                        width: `${Math.min(100, Math.abs(sec.changePercent) * 28 + 8)}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
