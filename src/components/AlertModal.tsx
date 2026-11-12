import React, { useState } from 'react';
import { MarketItem, AlertItem } from '../types/market';
import { formatPrice } from '../utils/chartHelpers';
import { X, Bell, Check } from 'lucide-react';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MarketItem | null;
  onAddAlert: (alert: AlertItem) => void;
}

export const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  onClose,
  item,
  onAddAlert,
}) => {
  const [targetPrice, setTargetPrice] = useState<string>(item ? item.price.toString() : '');
  const [condition, setCondition] = useState<'above' | 'below'>('above');
  const [saved, setSaved] = useState(false);

  if (!isOpen || !item) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const priceVal = parseFloat(targetPrice);
    if (!priceVal) return;

    onAddAlert({
      id: `alert-${Date.now()}`,
      symbol: item.symbol,
      targetPrice: priceVal,
      condition,
      createdAt: Date.now(),
    });

    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div
        className="w-full max-w-sm bg-white dark:bg-[#1e222d] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#2a2e39] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-[#2a2e39]">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Create Alert for {item.symbol}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {saved ? (
          <div className="p-6 text-center text-xs space-y-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-[#089981] flex items-center justify-center mx-auto">
              <Check className="w-5 h-5" />
            </div>
            <p className="font-semibold text-slate-900 dark:text-white">Price Alert Saved!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 space-y-3 text-xs">
            <div className="text-slate-500 dark:text-slate-400">
              Current price: <span className="font-mono font-bold text-slate-900 dark:text-white">${formatPrice(item.price, item.category)}</span>
            </div>

            <div>
              <label className="text-slate-500 dark:text-slate-400 block mb-1">Trigger Condition</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#131722] border border-slate-200 dark:border-[#2a2e39] rounded-lg text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="above">Price crosses above (&gt;)</option>
                <option value="below">Price crosses below (&lt;)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-500 dark:text-slate-400 block mb-1">Target Price ($)</label>
              <input
                type="number"
                step="any"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#131722] border border-slate-200 dark:border-[#2a2e39] rounded-lg text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl font-bold text-white bg-[#2962ff] hover:bg-[#1e53e5] transition-colors shadow-xs"
            >
              Set Price Alert
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
