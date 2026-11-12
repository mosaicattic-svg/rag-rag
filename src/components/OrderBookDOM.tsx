import React, { useState, useEffect } from 'react';
import { MarketItem, OrderBookLevel, TimeAndSalesTrade } from '../types/market';
import { generateOrderBook, formatPrice } from '../utils/chartHelpers';
import { Layers, Activity, ArrowDown, ArrowUp } from 'lucide-react';

interface OrderBookDOMProps {
  item: MarketItem;
  onQuickTrade?: (item: MarketItem, side: 'buy' | 'sell') => void;
}

export const OrderBookDOM: React.FC<OrderBookDOMProps> = ({ item, onQuickTrade }) => {
  const [tab, setTab] = useState<'dom' | 'trades'>('dom');
  const [orderBook, setOrderBook] = useState<{ bids: OrderBookLevel[]; asks: OrderBookLevel[] }>(() =>
    generateOrderBook(item.price)
  );
  const [tape, setTape] = useState<TimeAndSalesTrade[]>([]);

  // Update order book when price updates & simulate live trades
  useEffect(() => {
    setOrderBook(generateOrderBook(item.price));

    // Append new trade to tape
    const isUp = Math.random() > 0.48;
    const newTrade: TimeAndSalesTrade = {
      id: `trade-${Date.now()}-${Math.random()}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      price: item.price + (isUp ? 0.02 : -0.02),
      size: Math.floor(Math.random() * 80) + 5,
      side: isUp ? 'buy' : 'sell',
    };
    setTape((prev) => [newTrade, ...prev.slice(0, 14)]);
  }, [item.price]);

  const spread = Math.abs(orderBook.asks[0]?.price - orderBook.bids[0]?.price) || 0.02;

  return (
    <div className="bg-white dark:bg-[#131722] border border-slate-200 dark:border-[#2a2e39] rounded-xl overflow-hidden shadow-sm flex flex-col h-[380px]">
      {/* Header Tabs */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 dark:border-[#2a2e39]">
        <div className="flex items-center gap-1.5 p-0.5 bg-slate-100 dark:bg-[#1e222d] rounded-lg text-xs">
          <button
            onClick={() => setTab('dom')}
            className={`px-3 py-1 rounded font-semibold transition-colors ${
              tab === 'dom'
                ? 'bg-white dark:bg-[#2962ff] text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Order Book (L2)
          </button>
          <button
            onClick={() => setTab('trades')}
            className={`px-3 py-1 rounded font-semibold transition-colors ${
              tab === 'trades'
                ? 'bg-white dark:bg-[#2962ff] text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Time & Sales
          </button>
        </div>

        <div className="text-[11px] font-mono text-slate-400">
          Spread: <span className="text-slate-700 dark:text-slate-200 font-bold">${spread.toFixed(2)}</span>
        </div>
      </div>

      {/* Content */}
      {tab === 'dom' ? (
        <div className="flex-1 flex flex-col justify-between p-3 text-xs font-mono select-none overflow-hidden">
          {/* Asks (Sells) Top */}
          <div className="space-y-1">
            <div className="grid grid-cols-3 text-[10px] text-slate-400 uppercase pb-1 border-b border-slate-100 dark:border-[#2a2e39]">
              <span>Price ($)</span>
              <span className="text-center">Size</span>
              <span className="text-right">Total</span>
            </div>
            {orderBook.asks.slice(0, 5).reverse().map((ask, idx) => (
              <div
                key={`ask-${idx}`}
                className="grid grid-cols-3 py-0.5 relative group hover:bg-rose-500/10 cursor-pointer rounded"
                onClick={() => onQuickTrade && onQuickTrade(item, 'sell')}
              >
                {/* Visual Depth Bar */}
                <div
                  className="absolute right-0 top-0 bottom-0 bg-[#f23645]/15 rounded"
                  style={{ width: `${ask.depthPercent}%` }}
                />
                <span className="text-[#f23645] font-bold z-10">{formatPrice(ask.price, item.category)}</span>
                <span className="text-center text-slate-600 dark:text-slate-300 z-10">{ask.size}</span>
                <span className="text-right text-slate-400 z-10">{ask.total}</span>
              </div>
            ))}
          </div>

          {/* Current Mid Price Banner */}
          <div className="my-2 py-2 px-3 bg-slate-50 dark:bg-[#181c27] rounded-lg border border-slate-200 dark:border-[#2a2e39] flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-sm">
              <span className="text-slate-900 dark:text-white">{formatPrice(item.price, item.category)}</span>
              {item.change >= 0 ? (
                <ArrowUp className="w-4 h-4 text-[#089981]" />
              ) : (
                <ArrowDown className="w-4 h-4 text-[#f23645]" />
              )}
            </div>
            <span className="text-[11px] text-slate-400">Market Price</span>
          </div>

          {/* Bids (Buys) Bottom */}
          <div className="space-y-1">
            {orderBook.bids.slice(0, 5).map((bid, idx) => (
              <div
                key={`bid-${idx}`}
                className="grid grid-cols-3 py-0.5 relative group hover:bg-emerald-500/10 cursor-pointer rounded"
                onClick={() => onQuickTrade && onQuickTrade(item, 'buy')}
              >
                {/* Visual Depth Bar */}
                <div
                  className="absolute right-0 top-0 bottom-0 bg-[#089981]/15 rounded"
                  style={{ width: `${bid.depthPercent}%` }}
                />
                <span className="text-[#089981] font-bold z-10">{formatPrice(bid.price, item.category)}</span>
                <span className="text-center text-slate-600 dark:text-slate-300 z-10">{bid.size}</span>
                <span className="text-right text-slate-400 z-10">{bid.total}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Time & Sales Tape */
        <div className="flex-1 overflow-y-auto p-3 text-xs font-mono">
          <div className="grid grid-cols-3 text-[10px] text-slate-400 uppercase pb-1 border-b border-slate-100 dark:border-[#2a2e39] mb-1">
            <span>Time</span>
            <span className="text-center">Price ($)</span>
            <span className="text-right">Size</span>
          </div>
          <div className="space-y-1">
            {tape.map((t) => (
              <div key={t.id} className="grid grid-cols-3 py-1 hover:bg-slate-50 dark:hover:bg-[#181c27] rounded px-1">
                <span className="text-slate-400 text-[11px]">{t.time}</span>
                <span className={`text-center font-bold ${t.side === 'buy' ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                  {formatPrice(t.price, item.category)}
                </span>
                <span className="text-right text-slate-600 dark:text-slate-300 font-semibold">{t.size}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
