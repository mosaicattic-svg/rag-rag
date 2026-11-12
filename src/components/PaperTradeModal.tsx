import React, { useState } from 'react';
import { MarketItem, TradePosition } from '../types/market';
import { formatPrice } from '../utils/chartHelpers';
import { X, CheckCircle, ShieldAlert } from 'lucide-react';

interface PaperTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MarketItem | null;
  initialSide: 'buy' | 'sell';
  onExecuteTrade: (position: Omit<TradePosition, 'id' | 'openTime' | 'pnl' | 'pnlPercent'>) => void;
}

export const PaperTradeModal: React.FC<PaperTradeModalProps> = ({
  isOpen,
  onClose,
  item,
  initialSide,
  onExecuteTrade,
}) => {
  const [side, setSide] = useState<'buy' | 'sell'>(initialSide);
  const [qty, setQty] = useState<number>(10);
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [limitPrice, setLimitPrice] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);

  if (!isOpen || !item) return null;

  const currentPrice = item.price;
  const executionPrice = orderType === 'market' ? currentPrice : (parseFloat(limitPrice) || currentPrice);
  const totalValue = executionPrice * qty;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onExecuteTrade({
      symbol: item.symbol,
      side,
      qty,
      entryPrice: executionPrice,
      currentPrice,
    });
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div
        className="w-full max-w-md bg-white dark:bg-[#1e222d] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#2a2e39] overflow-hidden animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-[#2a2e39]">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-base text-slate-900 dark:text-white font-mono">
              Order {item.symbol}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              ${formatPrice(item.price, item.category)}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-3">
            <CheckCircle className="w-12 h-12 text-[#089981] mx-auto animate-bounce" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Order Executed Successfully!
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              {side.toUpperCase()} {qty} shares of {item.symbol} at ${formatPrice(executionPrice, item.category)}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
            {/* Side Tabs: Buy vs Sell */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-[#131722] rounded-xl font-semibold">
              <button
                type="button"
                onClick={() => setSide('buy')}
                className={`py-2 rounded-lg transition-colors ${
                  side === 'buy'
                    ? 'bg-[#089981] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Buy (Long)
              </button>
              <button
                type="button"
                onClick={() => setSide('sell')}
                className={`py-2 rounded-lg transition-colors ${
                  side === 'sell'
                    ? 'bg-[#f23645] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Sell (Short)
              </button>
            </div>

            {/* Order Type */}
            <div>
              <label className="text-slate-500 dark:text-slate-400 block mb-1 font-medium">Order Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOrderType('market')}
                  className={`py-1.5 rounded-lg border font-semibold transition-colors ${
                    orderType === 'market'
                      ? 'border-[#2962ff] text-[#2962ff] bg-blue-50/50 dark:bg-blue-500/10'
                      : 'border-slate-200 dark:border-[#2a2e39] text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Market
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOrderType('limit');
                    if (!limitPrice) setLimitPrice(item.price.toString());
                  }}
                  className={`py-1.5 rounded-lg border font-semibold transition-colors ${
                    orderType === 'limit'
                      ? 'border-[#2962ff] text-[#2962ff] bg-blue-50/50 dark:bg-blue-500/10'
                      : 'border-slate-200 dark:border-[#2a2e39] text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Limit
                </button>
              </div>
            </div>

            {/* Quantity */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-slate-500 dark:text-slate-400 font-medium">Units / Shares</label>
                <div className="flex gap-1 text-[11px] font-mono">
                  {[1, 5, 10, 50, 100].map((v) => (
                    <button
                      type="button"
                      key={v}
                      onClick={() => setQty(v)}
                      className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#2a2e39] text-slate-600 dark:text-slate-300 hover:text-white"
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="number"
                min="1"
                value={qty}
                onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#131722] border border-slate-200 dark:border-[#2a2e39] rounded-lg text-slate-900 dark:text-white font-mono font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Limit Price Input if limit order */}
            {orderType === 'limit' && (
              <div>
                <label className="text-slate-500 dark:text-slate-400 block mb-1 font-medium">Limit Price ($)</label>
                <input
                  type="number"
                  step="any"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#131722] border border-slate-200 dark:border-[#2a2e39] rounded-lg text-slate-900 dark:text-white font-mono font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Summary Box */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#131722] border border-slate-200 dark:border-[#2a2e39] space-y-1 font-mono text-xs">
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Estimated Value:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Trading Fee:</span>
                <span className="text-[#089981] font-semibold">$0.00 (Zero Commission)</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className={`w-full py-2.5 rounded-xl font-bold text-white transition-colors shadow-sm ${
                side === 'buy'
                  ? 'bg-[#089981] hover:bg-[#077d69]'
                  : 'bg-[#f23645] hover:bg-[#d62736]'
              }`}
            >
              Place {side.toUpperCase()} Order
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
