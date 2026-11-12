import React, { useState } from 'react';
import { MarketItem, AlertItem, TradePosition } from '../types/market';
import { formatPercent, formatPrice } from '../utils/chartHelpers';
import {
  X,
  Trash2,
  Bell,
  TrendingUp,
  TrendingDown,
  Plus,
  Briefcase,
  BookmarkCheck,
} from 'lucide-react';

interface WatchlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  watchlistSymbols: string[];
  items: MarketItem[];
  onSelectItem: (item: MarketItem) => void;
  onRemoveFromWatchlist: (symbol: string) => void;
  alerts: AlertItem[];
  onRemoveAlert: (id: string) => void;
  positions: TradePosition[];
  onClosePosition: (id: string) => void;
  onOpenSearch: () => void;
}

export const WatchlistDrawer: React.FC<WatchlistDrawerProps> = ({
  isOpen,
  onClose,
  watchlistSymbols,
  items,
  onSelectItem,
  onRemoveFromWatchlist,
  alerts,
  onRemoveAlert,
  positions,
  onClosePosition,
  onOpenSearch,
}) => {
  const [activeTab, setActiveTab] = useState<'watchlist' | 'alerts' | 'positions'>('watchlist');

  if (!isOpen) return null;

  const watchlistItems = watchlistSymbols
    .map((sym) => items.find((i) => i.symbol === sym))
    .filter(Boolean) as MarketItem[];

  const totalPnl = positions.reduce((acc, pos) => {
    const cur = items.find((i) => i.symbol === pos.symbol);
    const curPrice = cur ? cur.price : pos.currentPrice;
    const diff = pos.side === 'buy' ? curPrice - pos.entryPrice : pos.entryPrice - curPrice;
    return acc + diff * pos.qty;
  }, 0);

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-white dark:bg-[#131722] border-l border-slate-200 dark:border-[#2a2e39] shadow-2xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-[#2a2e39]">
        <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-[#1e222d] rounded-lg text-xs">
          <button
            onClick={() => setActiveTab('watchlist')}
            className={`px-3 py-1 rounded font-semibold transition-colors ${
              activeTab === 'watchlist'
                ? 'bg-white dark:bg-[#2962ff] text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Watchlist ({watchlistSymbols.length})
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`px-3 py-1 rounded font-semibold transition-colors ${
              activeTab === 'alerts'
                ? 'bg-white dark:bg-[#2962ff] text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Alerts ({alerts.length})
          </button>
          <button
            onClick={() => setActiveTab('positions')}
            className={`px-3 py-1 rounded font-semibold transition-colors ${
              activeTab === 'positions'
                ? 'bg-white dark:bg-[#2962ff] text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Trades ({positions.length})
          </button>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-[#1e222d] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* TAB 1: WATCHLIST */}
        {activeTab === 'watchlist' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Starred Symbols
              </span>
              <button
                onClick={onOpenSearch}
                className="text-xs font-semibold text-[#2962ff] hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Symbol
              </button>
            </div>

            {watchlistItems.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No symbols in your watchlist.
                <button
                  onClick={onOpenSearch}
                  className="block mx-auto mt-2 text-[#2962ff] font-semibold hover:underline"
                >
                  Browse and add symbols
                </button>
              </div>
            ) : (
              watchlistItems.map((item) => {
                const isUp = item.change >= 0;
                return (
                  <div
                    key={item.symbol}
                    onClick={() => {
                      onSelectItem(item);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-[#181c27] hover:bg-slate-100 dark:hover:bg-[#1f2433] transition-colors cursor-pointer group"
                  >
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white font-mono text-sm group-hover:text-[#2962ff]">
                        {item.symbol}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                        {item.name}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
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

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveFromWatchlist(item.symbol);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                        title="Remove from Watchlist"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: PRICE ALERTS */}
        {activeTab === 'alerts' && (
          <div className="space-y-3">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Active Price Alert Triggers
            </div>
            {alerts.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No active price alerts.
                <p className="mt-1">Click "Alert" on any chart to set price thresholds.</p>
              </div>
            ) : (
              alerts.map((al) => (
                <div
                  key={al.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-[#181c27] border border-slate-200 dark:border-[#2a2e39] text-xs font-mono"
                >
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-amber-500" />
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">
                        {al.symbol} {al.condition} ${al.targetPrice}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Created {new Date(al.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => onRemoveAlert(al.id)}
                    className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: TRADING POSITIONS */}
        {activeTab === 'positions' && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-[#1a2336] border border-blue-200 dark:border-blue-500/20 text-xs">
              <span className="text-slate-500 dark:text-slate-400">Unrealized P&L: </span>
              <span
                className={`font-mono font-bold text-sm ml-1 ${
                  totalPnl >= 0 ? 'text-[#089981]' : 'text-[#f23645]'
                }`}
              >
                {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
              </span>
            </div>

            {positions.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No open simulated positions.
                <p className="mt-1">Use the "Buy / Sell" buttons on charts or screeners to place paper orders.</p>
              </div>
            ) : (
              positions.map((pos) => {
                const curItem = items.find((i) => i.symbol === pos.symbol);
                const curPrice = curItem ? curItem.price : pos.currentPrice;
                const pnl = pos.side === 'buy' ? (curPrice - pos.entryPrice) * pos.qty : (pos.entryPrice - curPrice) * pos.qty;
                const isProfit = pnl >= 0;

                return (
                  <div
                    key={pos.id}
                    className="p-3 rounded-lg bg-slate-50 dark:bg-[#181c27] border border-slate-200 dark:border-[#2a2e39] text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 dark:text-white font-mono">
                          {pos.symbol}
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
                            pos.side === 'buy'
                              ? 'bg-emerald-500/10 text-[#089981]'
                              : 'bg-rose-500/10 text-[#f23645]'
                          }`}
                        >
                          {pos.side}
                        </span>
                      </div>
                      <span className="font-mono text-slate-400">{pos.qty} shares</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <div>
                        <span className="text-slate-400">Entry: </span>
                        <span>${formatPrice(pos.entryPrice)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Current: </span>
                        <span>${formatPrice(curPrice)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-[#2a2e39]">
                      <div className="font-mono font-bold text-xs">
                        <span className={isProfit ? 'text-[#089981]' : 'text-[#f23645]'}>
                          {isProfit ? '+' : ''}${pnl.toFixed(2)}
                        </span>
                      </div>
                      <button
                        onClick={() => onClosePosition(pos.id)}
                        className="px-2 py-0.5 rounded text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                      >
                        Close Position
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};
