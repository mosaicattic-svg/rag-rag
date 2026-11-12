import React from 'react';
import { MarketItem } from '../types/market';

interface TechnicalGaugeProps {
  item: MarketItem;
}

export const TechnicalGauge: React.FC<TechnicalGaugeProps> = ({ item }) => {
  // Determine needle rotation angle:
  // -90deg is Strong Sell, -45deg is Sell, 0deg is Neutral, +45deg is Buy, +90deg is Strong Buy
  let angle = 0;
  let summaryText = item.technicalRating;
  let summaryColor = '#f59e0b';
  let oscBuy = 2, oscNeutral = 8, oscSell = 1;
  let maBuy = 12, maNeutral = 1, maSell = 2;

  if (item.technicalRating === 'Strong Buy') {
    angle = 68;
    summaryColor = '#089981';
    oscBuy = 4; oscNeutral = 6; oscSell = 1;
    maBuy = 14; maNeutral = 0; maSell = 1;
  } else if (item.technicalRating === 'Buy') {
    angle = 35;
    summaryColor = '#089981';
    oscBuy = 3; oscNeutral = 7; oscSell = 1;
    maBuy = 11; maNeutral = 2; maSell = 2;
  } else if (item.technicalRating === 'Neutral') {
    angle = 0;
    summaryColor = '#787b86';
    oscBuy = 2; oscNeutral = 8; oscSell = 1;
    maBuy = 7; maNeutral = 3; maSell = 5;
  } else if (item.technicalRating === 'Sell') {
    angle = -35;
    summaryColor = '#f23645';
    oscBuy = 1; oscNeutral = 6; oscSell = 4;
    maBuy = 3; maNeutral = 2; maSell = 10;
  } else if (item.technicalRating === 'Strong Sell') {
    angle = -68;
    summaryColor = '#f23645';
    oscBuy = 0; oscNeutral = 3; oscSell = 8;
    maBuy = 1; maNeutral = 1; maSell = 13;
  }

  return (
    <div className="bg-white dark:bg-[#131722] border border-slate-200 dark:border-[#2a2e39] rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#2a2e39] mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Technical Analysis</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Oscillators & Moving Averages</p>
        </div>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded font-mono"
          style={{ color: summaryColor, backgroundColor: `${summaryColor}15` }}
        >
          {summaryText}
        </span>
      </div>

      {/* Speedometer Gauge Arc SVG */}
      <div className="relative flex flex-col items-center justify-center my-2">
        <svg viewBox="0 0 200 110" className="w-56 h-32 overflow-visible">
          {/* Background Arc Segments */}
          {/* Strong Sell (Red) */}
          <path
            d="M 20 100 A 80 80 0 0 1 45 45"
            fill="none"
            stroke="#f23645"
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* Sell (Orange) */}
          <path
            d="M 50 40 A 80 80 0 0 1 85 23"
            fill="none"
            stroke="#fb923c"
            strokeWidth="12"
          />
          {/* Neutral (Gray) */}
          <path
            d="M 90 22 A 80 80 0 0 1 110 22"
            fill="none"
            stroke="#94a3b8"
            strokeWidth="12"
          />
          {/* Buy (Light Green) */}
          <path
            d="M 115 23 A 80 80 0 0 1 150 40"
            fill="none"
            stroke="#34d399"
            strokeWidth="12"
          />
          {/* Strong Buy (Deep Green) */}
          <path
            d="M 155 45 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#089981"
            strokeWidth="12"
            strokeLinecap="round"
          />

          {/* Pivot Center Pin */}
          <circle cx="100" cy="100" r="7" fill="#64748b" />
          <circle cx="100" cy="100" r="3" fill="#ffffff" />

          {/* Needle Pointer */}
          <g
            style={{
              transform: `rotate(${angle}deg)`,
              transformOrigin: '100px 100px',
              transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <polygon points="98,100 102,100 100,28" fill="#e2e8f0" />
            <polygon points="99,100 101,100 100,25" fill="#3b82f6" />
          </g>
        </svg>

        {/* Labels under arc */}
        <div className="flex justify-between w-full max-w-[240px] text-[10px] font-semibold text-slate-400 mt-1 uppercase">
          <span className="text-[#f23645]">Strong Sell</span>
          <span className="text-slate-400">Neutral</span>
          <span className="text-[#089981]">Strong Buy</span>
        </div>
      </div>

      {/* Breakdown Breakdown Counts */}
      <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-200 dark:border-[#2a2e39] text-xs">
        {/* Oscillators */}
        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#1a1e29]">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1.5">
            Oscillators
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-[#089981] font-semibold">{oscBuy} Buy</span>
            <span className="text-slate-400">{oscNeutral} Neu</span>
            <span className="text-[#f23645] font-semibold">{oscSell} Sell</span>
          </div>
        </div>

        {/* Moving Averages */}
        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#1a1e29]">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1.5">
            Moving Averages
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-[#089981] font-semibold">{maBuy} Buy</span>
            <span className="text-slate-400">{maNeutral} Neu</span>
            <span className="text-[#f23645] font-semibold">{maSell} Sell</span>
          </div>
        </div>
      </div>
    </div>
  );
};
