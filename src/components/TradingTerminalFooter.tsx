import React, { useState } from 'react';
import { TradePosition, EconomicEvent, BacktestReport, MarketItem } from '../types/market';
import { formatPrice, formatPercent } from '../utils/chartHelpers';
import {
  ChevronUp,
  ChevronDown,
  Briefcase,
  Calendar,
  Code2,
  ListOrdered,
  TrendingUp,
  AlertCircle,
  Play,
  RotateCcw,
} from 'lucide-react';

interface TradingTerminalFooterProps {
  positions: TradePosition[];
  onClosePosition: (id: string) => void;
  items: MarketItem[];
  selectedItem: MarketItem;
}

export const TradingTerminalFooter: React.FC<TradingTerminalFooterProps> = ({
  positions,
  onClosePosition,
  items,
  selectedItem,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'positions' | 'orders' | 'calendar' | 'strategy'>('positions');

  // Simulated Macro Calendar
  const economicEvents: EconomicEvent[] = [
    {
      id: 'cal-1',
      time: '08:30 EST',
      currency: 'USD',
      event: 'Core CPI Inflation YoY',
      impact: 'High',
      actual: '3.3%',
      forecast: '3.3%',
      previous: '3.2%',
    },
    {
      id: 'cal-2',
      time: '14:00 EST',
      currency: 'USD',
      event: 'FOMC Interest Rate Decision',
      impact: 'High',
      actual: '4.75%',
      forecast: '4.75%',
      previous: '5.00%',
    },
    {
      id: 'cal-3',
      time: '16:30 EST',
      currency: 'USD',
      event: 'NVIDIA (NVDA) Q3 Fiscal Earnings Release',
      impact: 'High',
      forecast: '$0.75 EPS',
      previous: '$0.68 EPS',
    },
    {
      id: 'cal-4',
      time: '09:45 EST',
      currency: 'EUR',
      event: 'Eurozone S&P Global Composite PMI',
      impact: 'Medium',
      actual: '50.2',
      forecast: '49.8',
      previous: '49.6',
    },
    {
      id: 'cal-5',
      time: '08:30 EST',
      currency: 'USD',
      event: 'US Non-Farm Payrolls (NFP)',
      impact: 'High',
      forecast: '180K',
      previous: '254K',
    },
  ];

  // Strategy Tester Report for the active symbol
  const backtestReport: BacktestReport = {
    strategyName: `Bollinger Breakout + EMA Trend (${selectedItem.symbol})`,
    netProfitPercent: 38.45,
    profitFactor: 2.18,
    winRatePercent: 63.8,
    maxDrawdownPercent: 7.92,
    totalTrades: 142,
    sharpeRatio: 1.86,
    equityCurve: [10000, 10420, 10280, 10890, 11450, 11200, 12100, 12850, 13420, 13845],
  };

  const totalUnrealizedPnl = positions.reduce((acc, pos) => {
    const cur = items.find((i) => i.symbol === pos.symbol);
    const curPrice = cur ? cur.price : pos.currentPrice;
    const diff = pos.side === 'buy' ? curPrice - pos.entryPrice : pos.entryPrice - curPrice;
    return acc + diff * pos.qty;
  }, 0);

  return (
    <div className="bg-white dark:bg-[#131722] border-t border-slate-200 dark:border-[#2a2e39] shadow-lg transition-all">
      {/* Dock Header Tabs & Toggle */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-[#2a2e39] text-xs">
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setActiveTab('positions');
              setIsOpen(true);
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-colors ${
              activeTab === 'positions' && isOpen
                ? 'bg-slate-100 dark:bg-[#202533] text-[#2962ff]'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Open Positions ({positions.length})</span>
            {positions.length > 0 && (
              <span
                className={`font-mono font-bold text-[11px] ml-1 ${
                  totalUnrealizedPnl >= 0 ? 'text-[#089981]' : 'text-[#f23645]'
                }`}
              >
                {totalUnrealizedPnl >= 0 ? '+' : ''}${totalUnrealizedPnl.toFixed(2)}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('calendar');
              setIsOpen(true);
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-colors ${
              activeTab === 'calendar' && isOpen
                ? 'bg-slate-100 dark:bg-[#202533] text-[#2962ff]'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Economic Calendar</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('strategy');
              setIsOpen(true);
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-colors ${
              activeTab === 'strategy' && isOpen
                ? 'bg-slate-100 dark:bg-[#202533] text-[#2962ff]'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Strategy Tester</span>
          </button>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded transition-colors"
          title={isOpen ? 'Collapse Terminal' : 'Expand Terminal'}
        >
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>

      {/* Dock Content */}
      {isOpen && (
        <div className="h-48 overflow-y-auto p-4 text-xs select-none">
          {/* TAB 1: POSITIONS */}
          {activeTab === 'positions' && (
            <div>
              {positions.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  No active trade positions open. Place a Buy/Sell order using the chart or order book.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono">
                    <thead className="text-[10px] text-slate-400 border-b border-slate-200 dark:border-[#2a2e39] pb-1 uppercase">
                      <tr>
                        <th className="pb-1.5 font-semibold">Symbol</th>
                        <th className="pb-1.5 font-semibold">Side</th>
                        <th className="pb-1.5 font-semibold text-right">Shares</th>
                        <th className="pb-1.5 font-semibold text-right">Avg Entry</th>
                        <th className="pb-1.5 font-semibold text-right">Mark Price</th>
                        <th className="pb-1.5 font-semibold text-right">Unrealized P&L ($)</th>
                        <th className="pb-1.5 font-semibold text-right">Return %</th>
                        <th className="pb-1.5 font-semibold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#1e222d]">
                      {positions.map((pos) => {
                        const cur = items.find((i) => i.symbol === pos.symbol);
                        const curPrice = cur ? cur.price : pos.currentPrice;
                        const pnl = pos.side === 'buy' ? (curPrice - pos.entryPrice) * pos.qty : (pos.entryPrice - curPrice) * pos.qty;
                        const pnlPct = (pnl / (pos.entryPrice * pos.qty)) * 100;
                        const isProfitable = pnl >= 0;

                        return (
                          <tr key={pos.id} className="hover:bg-slate-50 dark:hover:bg-[#181c27]">
                            <td className="py-2.5 font-bold text-slate-900 dark:text-white">
                              {pos.symbol}
                            </td>
                            <td className="py-2.5">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  pos.side === 'buy'
                                    ? 'bg-emerald-500/10 text-[#089981]'
                                    : 'bg-rose-500/10 text-[#f23645]'
                                }`}
                              >
                                {pos.side}
                              </span>
                            </td>
                            <td className="py-2.5 text-right text-slate-700 dark:text-slate-300">
                              {pos.qty}
                            </td>
                            <td className="py-2.5 text-right text-slate-700 dark:text-slate-300">
                              ${formatPrice(pos.entryPrice)}
                            </td>
                            <td className="py-2.5 text-right font-bold text-slate-900 dark:text-white">
                              ${formatPrice(curPrice)}
                            </td>
                            <td className="py-2.5 text-right font-bold">
                              <span className={isProfitable ? 'text-[#089981]' : 'text-[#f23645]'}>
                                {isProfitable ? '+' : ''}${pnl.toFixed(2)}
                              </span>
                            </td>
                            <td className="py-2.5 text-right font-bold">
                              <span className={isProfitable ? 'text-[#089981]' : 'text-[#f23645]'}>
                                {formatPercent(pnlPct)}
                              </span>
                            </td>
                            <td className="py-2.5 text-right">
                              <button
                                onClick={() => onClosePosition(pos.id)}
                                className="px-2 py-0.5 rounded text-[10px] font-semibold text-rose-500 hover:bg-rose-500/10 transition-colors"
                              >
                                Close
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ECONOMIC CALENDAR */}
          {activeTab === 'calendar' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono">
                <thead className="text-[10px] text-slate-400 border-b border-slate-200 dark:border-[#2a2e39] pb-1 uppercase">
                  <tr>
                    <th className="pb-1.5 font-semibold">Time</th>
                    <th className="pb-1.5 font-semibold">Currency</th>
                    <th className="pb-1.5 font-semibold">Event Description</th>
                    <th className="pb-1.5 font-semibold text-center">Impact</th>
                    <th className="pb-1.5 font-semibold text-right">Actual</th>
                    <th className="pb-1.5 font-semibold text-right">Forecast</th>
                    <th className="pb-1.5 font-semibold text-right">Previous</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#1e222d]">
                  {economicEvents.map((evt) => (
                    <tr key={evt.id} className="hover:bg-slate-50 dark:hover:bg-[#181c27]">
                      <td className="py-2.5 text-slate-500">{evt.time}</td>
                      <td className="py-2.5 font-bold text-slate-900 dark:text-white">{evt.currency}</td>
                      <td className="py-2.5 font-sans font-medium text-slate-800 dark:text-slate-200">{evt.event}</td>
                      <td className="py-2.5 text-center">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            evt.impact === 'High'
                              ? 'bg-rose-500/10 text-rose-500'
                              : 'bg-amber-500/10 text-amber-500'
                          }`}
                        >
                          {evt.impact}
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-bold text-slate-900 dark:text-white">
                        {evt.actual || '-'}
                      </td>
                      <td className="py-2.5 text-right text-slate-500">{evt.forecast || '-'}</td>
                      <td className="py-2.5 text-right text-slate-500">{evt.previous}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: STRATEGY TESTER */}
          {activeTab === 'strategy' && (
            <div className="space-y-3 font-mono">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#2a2e39]">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs font-sans">
                    {backtestReport.strategyName}
                  </h4>
                  <p className="text-[11px] text-slate-400">Backtested over 120 trading sessions</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#089981] font-bold text-sm">
                    Net Profit: +{backtestReport.netProfitPercent}%
                  </span>
                </div>
              </div>

              {/* Key Backtest Performance Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#181c27] border border-slate-200 dark:border-[#2a2e39]">
                  <span className="text-[10px] text-slate-400 block mb-0.5">Profit Factor</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {backtestReport.profitFactor}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#181c27] border border-slate-200 dark:border-[#2a2e39]">
                  <span className="text-[10px] text-slate-400 block mb-0.5">Win Rate</span>
                  <span className="font-bold text-[#089981] text-sm">
                    {backtestReport.winRatePercent}%
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#181c27] border border-slate-200 dark:border-[#2a2e39]">
                  <span className="text-[10px] text-slate-400 block mb-0.5">Max Drawdown</span>
                  <span className="font-bold text-[#f23645] text-sm">
                    -{backtestReport.maxDrawdownPercent}%
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#181c27] border border-slate-200 dark:border-[#2a2e39]">
                  <span className="text-[10px] text-slate-400 block mb-0.5">Sharpe Ratio</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {backtestReport.sharpeRatio}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#181c27] border border-slate-200 dark:border-[#2a2e39]">
                  <span className="text-[10px] text-slate-400 block mb-0.5">Total Trades</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {backtestReport.totalTrades}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
