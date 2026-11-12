export type AssetCategory = 'overview' | 'stocks' | 'crypto' | 'forex' | 'indices' | 'futures' | 'heatmap' | 'screener' | 'news';

export type ChartType = 'candlestick' | 'area' | 'line' | 'heikin-ashi';
export type TimeFrame = '1D' | '5D' | '1M' | '3M' | '6M' | '1Y' | '5Y' | 'ALL';
export type LayoutMode = '1x1' | '2x1' | '2x2';

export type DrawingTool = 'cursor' | 'trendline' | 'horizontal' | 'fibonacci' | 'measure' | 'eraser';

export interface DrawingItem {
  id: string;
  type: DrawingTool;
  startX: number;
  startY: number;
  endX?: number;
  endY?: number;
  priceStart: number;
  priceEnd?: number;
  color: string;
}

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketItem {
  symbol: string;
  name: string;
  category: 'stock' | 'crypto' | 'forex' | 'index' | 'commodity' | 'bond';
  exchange: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  prevClose: number;
  volume: string;
  volumeNum: number;
  marketCap?: string;
  marketCapNum?: number;
  peRatio?: number;
  divYield?: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  sector?: string;
  country?: string;
  technicalRating: 'Strong Buy' | 'Buy' | 'Neutral' | 'Sell' | 'Strong Sell';
  sparkline: number[];
  baseCurrency?: string;
  quoteCurrency?: string;
  lastTickDir?: 'up' | 'down' | 'none';
}

export interface SectorPerformance {
  name: string;
  changePercent: number;
  marketWeight: number;
  leadingSymbol: string;
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  timeAgo: string;
  timestamp: number;
  relatedSymbols: string[];
  category: 'Markets' | 'Tech' | 'Crypto' | 'Macro' | 'Earnings';
  sentiment: 'Bullish' | 'Neutral' | 'Bearish';
  imageUrl?: string;
  url?: string;
}

export interface AlertItem {
  id: string;
  symbol: string;
  targetPrice: number;
  condition: 'above' | 'below';
  createdAt: number;
  triggered?: boolean;
}

export interface TradePosition {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  qty: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  openTime: number;
  stopLoss?: number;
  takeProfit?: number;
}

export interface OrderBookLevel {
  price: number;
  size: number;
  total: number;
  depthPercent: number;
}

export interface TimeAndSalesTrade {
  id: string;
  time: string;
  price: number;
  size: number;
  side: 'buy' | 'sell';
}

export interface EconomicEvent {
  id: string;
  time: string;
  currency: string;
  event: string;
  impact: 'High' | 'Medium' | 'Low';
  actual?: string;
  forecast?: string;
  previous: string;
}

export interface BacktestReport {
  strategyName: string;
  netProfitPercent: number;
  profitFactor: number;
  winRatePercent: number;
  maxDrawdownPercent: number;
  totalTrades: number;
  sharpeRatio: number;
  equityCurve: number[];
}
