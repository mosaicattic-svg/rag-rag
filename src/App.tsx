import React, { useState, useEffect } from 'react';
import {
  AssetCategory,
  MarketItem,
  AlertItem,
  TradePosition,
  NewsItem,
  SectorPerformance,
} from './types/market';
import {
  INITIAL_MARKET_DATA,
  SECTOR_PERFORMANCES,
  FINANCIAL_NEWS,
} from './data/mockMarketData';
import { Header } from './components/Header';
import { TickerTape } from './components/TickerTape';
import { MarketOverview } from './components/MarketOverview';
import { StockScreen } from './components/StockScreen';
import { CryptoScreen } from './components/CryptoScreen';
import { ForexScreen } from './components/ForexScreen';
import { FuturesScreen } from './components/FuturesScreen';
import { MarketHeatmap } from './components/MarketHeatmap';
import { ScreenerView } from './components/ScreenerView';
import { NewsView } from './components/NewsView';
import { WatchlistDrawer } from './components/WatchlistDrawer';
import { SearchModal } from './components/SearchModal';
import { PaperTradeModal } from './components/PaperTradeModal';
import { AlertModal } from './components/AlertModal';
import { Bell, CheckCircle, X } from 'lucide-react';

export default function App() {
  // Theme state: default dark mode for authentic TradingView look
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('tv_theme') as 'dark' | 'light') || 'dark';
  });

  // Active Category Screen
  const [currentCategory, setCurrentCategory] = useState<AssetCategory>('overview');

  // Market Dataset with live simulated ticks
  const [items, setItems] = useState<MarketItem[]>(INITIAL_MARKET_DATA);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('NVDA');

  // Simulation running state
  const [isSimulating, setIsSimulating] = useState<boolean>(true);

  // Watchlist stored in localStorage
  const [watchlistSymbols, setWatchlistSymbols] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('tv_watchlist');
      return saved ? JSON.parse(saved) : ['NVDA', 'BTCUSDT', 'SPX', 'AAPL', 'TSLA'];
    } catch {
      return ['NVDA', 'BTCUSDT', 'SPX', 'AAPL', 'TSLA'];
    }
  });

  // Alerts stored in localStorage
  const [alerts, setAlerts] = useState<AlertItem[]>(() => {
    try {
      const saved = localStorage.getItem('tv_alerts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Paper Trading Positions stored in localStorage
  const [positions, setPositions] = useState<TradePosition[]>(() => {
    try {
      const saved = localStorage.getItem('tv_positions');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // UI Drawer / Modal states
  const [isWatchlistOpen, setIsWatchlistOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [tradeModalItem, setTradeModalItem] = useState<{ item: MarketItem; side: 'buy' | 'sell' } | null>(null);
  const [alertModalItem, setAlertModalItem] = useState<MarketItem | null>(null);

  // Active toast notification for triggered price alerts
  const [activeToast, setActiveToast] = useState<{ id: string; message: string } | null>(null);

  // Sync theme with DOM root class
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.className = 'bg-[#131722] text-[#d1d4dc] antialiased selection:bg-[#2962ff]/30 selection:text-white';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.className = 'bg-[#f0f3fa] text-slate-900 antialiased selection:bg-[#2962ff]/30';
    }
    localStorage.setItem('tv_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Sync watchlist to localStorage
  useEffect(() => {
    localStorage.setItem('tv_watchlist', JSON.stringify(watchlistSymbols));
  }, [watchlistSymbols]);

  // Sync alerts to localStorage
  useEffect(() => {
    localStorage.setItem('tv_alerts', JSON.stringify(alerts));
  }, [alerts]);

  // Sync positions to localStorage
  useEffect(() => {
    localStorage.setItem('tv_positions', JSON.stringify(positions));
  }, [positions]);

  // Live price tick simulation loop
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setItems((prevItems) => {
        // Pick 2-3 random instruments to nudge
        const numUpdates = Math.floor(Math.random() * 3) + 1;
        const updated = [...prevItems];

        for (let i = 0; i < numUpdates; i++) {
          const randIdx = Math.floor(Math.random() * updated.length);
          const item = updated[randIdx];

          // Small random delta (e.g. -0.25% to +0.25%)
          const pctDelta = (Math.random() - 0.49) * 0.005;
          const oldPrice = item.price;
          let newPrice = oldPrice * (1 + pctDelta);

          // Forex decimal bounds
          if (item.category === 'forex') {
            newPrice = Number(newPrice.toFixed(4));
          } else if (item.price >= 100) {
            newPrice = Number(newPrice.toFixed(2));
          } else {
            newPrice = Number(newPrice.toFixed(4));
          }

          const change = newPrice - item.prevClose;
          const changePercent = (change / item.prevClose) * 100;
          const high = Math.max(item.high, newPrice);
          const low = Math.min(item.low, newPrice);

          // Update sparkline
          const sparkline = [...item.sparkline.slice(1), newPrice];

          // Check alerts for this symbol
          alerts.forEach((al) => {
            if (al.symbol === item.symbol && !al.triggered) {
              const triggeredAbove = al.condition === 'above' && newPrice >= al.targetPrice;
              const triggeredBelow = al.condition === 'below' && newPrice <= al.targetPrice;
              if (triggeredAbove || triggeredBelow) {
                setActiveToast({
                  id: al.id,
                  message: `Alert triggered: ${item.symbol} crossed ${al.condition} $${al.targetPrice} (now $${newPrice})`,
                });
                // mark triggered
                setAlerts((curAlerts) =>
                  curAlerts.map((a) => (a.id === al.id ? { ...a, triggered: true } : a))
                );
              }
            }
          });

          updated[randIdx] = {
            ...item,
            price: newPrice,
            change,
            changePercent,
            high,
            low,
            sparkline,
            lastTickDir: newPrice >= oldPrice ? 'up' : 'down',
          };
        }

        return updated;
      });
    }, 1800);

    return () => clearInterval(interval);
  }, [isSimulating, alerts]);

  // Currently selected item
  const selectedItem = items.find((i) => i.symbol === selectedSymbol) || items[0];

  // Watchlist handlers
  const handleToggleWatchlist = (symbol: string) => {
    setWatchlistSymbols((prev) =>
      prev.includes(symbol) ? prev.filter((s) => s !== symbol) : [...prev, symbol]
    );
  };

  const handleRemoveFromWatchlist = (symbol: string) => {
    setWatchlistSymbols((prev) => prev.filter((s) => s !== symbol));
  };

  // Trade Execution
  const handleExecuteTrade = (
    posData: Omit<TradePosition, 'id' | 'openTime' | 'pnl' | 'pnlPercent'>
  ) => {
    const newPos: TradePosition = {
      ...posData,
      id: `pos-${Date.now()}`,
      openTime: Date.now(),
      pnl: 0,
      pnlPercent: 0,
    };
    setPositions((prev) => [newPos, ...prev]);
  };

  const handleClosePosition = (id: string) => {
    setPositions((prev) => prev.filter((p) => p.id !== id));
  };

  // Add Alert
  const handleAddAlert = (newAlert: AlertItem) => {
    setAlerts((prev) => [newAlert, ...prev]);
  };

  const handleRemoveAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors">
      {/* 1. Global Scrolling Ticker Tape Bar */}
      <TickerTape
        items={items}
        selectedSymbol={selectedSymbol}
        onSelectSymbol={(sym) => {
          setSelectedSymbol(sym);
          // if not on overview or stocks, set to overview
          if (currentCategory === 'news' || currentCategory === 'heatmap') {
            setCurrentCategory('overview');
          }
        }}
      />

      {/* 2. Top Navigation Bar */}
      <Header
        currentCategory={currentCategory}
        onSelectCategory={setCurrentCategory}
        onOpenSearch={() => setIsSearchOpen(true)}
        onToggleWatchlist={() => setIsWatchlistOpen((prev) => !prev)}
        watchlistCount={watchlistSymbols.length}
        theme={theme}
        onToggleTheme={toggleTheme}
        isSimulating={isSimulating}
        onToggleSimulation={() => setIsSimulating((prev) => !prev)}
      />

      {/* Toast Notification Banner */}
      {activeToast && (
        <div className="fixed top-16 right-4 z-50 flex items-center gap-3 px-4 py-3 bg-amber-500 text-slate-950 font-semibold text-xs rounded-xl shadow-xl animate-in slide-in-from-top-2">
          <Bell className="w-4 h-4 shrink-0" />
          <span>{activeToast.message}</span>
          <button
            onClick={() => setActiveToast(null)}
            className="p-1 hover:bg-black/10 rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 3. Main Workspace Viewport */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto p-4 sm:p-6">
        {currentCategory === 'overview' && (
          <MarketOverview
            items={items}
            selectedItem={selectedItem}
            onSelectItem={(item) => setSelectedSymbol(item.symbol)}
            sectors={SECTOR_PERFORMANCES}
            news={FINANCIAL_NEWS}
            theme={theme}
            onQuickTrade={(item, side) => setTradeModalItem({ item, side })}
            onSetAlert={(item) => setAlertModalItem(item)}
            onSelectCategory={setCurrentCategory}
          />
        )}

        {currentCategory === 'stocks' && (
          <StockScreen
            items={items}
            onSelectItem={(item) => {
              setSelectedSymbol(item.symbol);
              setCurrentCategory('overview');
            }}
            onQuickTrade={(item, side) => setTradeModalItem({ item, side })}
          />
        )}

        {currentCategory === 'crypto' && (
          <CryptoScreen
            items={items}
            onSelectItem={(item) => {
              setSelectedSymbol(item.symbol);
              setCurrentCategory('overview');
            }}
            onQuickTrade={(item, side) => setTradeModalItem({ item, side })}
          />
        )}

        {currentCategory === 'forex' && (
          <ForexScreen
            items={items}
            onSelectItem={(item) => {
              setSelectedSymbol(item.symbol);
              setCurrentCategory('overview');
            }}
            onQuickTrade={(item, side) => setTradeModalItem({ item, side })}
          />
        )}

        {currentCategory === 'futures' && (
          <FuturesScreen
            items={items}
            onSelectItem={(item) => {
              setSelectedSymbol(item.symbol);
              setCurrentCategory('overview');
            }}
            onQuickTrade={(item, side) => setTradeModalItem({ item, side })}
          />
        )}

        {currentCategory === 'heatmap' && (
          <MarketHeatmap
            items={items}
            onSelectItem={(item) => {
              setSelectedSymbol(item.symbol);
              setCurrentCategory('overview');
            }}
          />
        )}

        {currentCategory === 'screener' && (
          <ScreenerView
            items={items}
            onSelectItem={(item) => {
              setSelectedSymbol(item.symbol);
              setCurrentCategory('overview');
            }}
            onQuickTrade={(item, side) => setTradeModalItem({ item, side })}
          />
        )}

        {currentCategory === 'news' && (
          <NewsView
            news={FINANCIAL_NEWS}
            items={items}
            onSelectSymbol={(sym) => {
              setSelectedSymbol(sym);
              setCurrentCategory('overview');
            }}
          />
        )}
      </main>

      {/* 4. Footer */}
      <footer className="border-t border-slate-200 dark:border-[#2a2e39] bg-white dark:bg-[#131722] py-6 px-4 sm:px-6 text-xs text-slate-500 dark:text-slate-400 mt-12 transition-colors">
        <div className="max-w-[1720px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900 dark:text-white">TradingView Markets</span>
            <span>·</span>
            <span>Real-time global quotes, market breadth & charting intelligence</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>Quotes simulated with realistic Brownian drift</span>
            <span>·</span>
            <span>Paper Trading Active</span>
          </div>
        </div>
      </footer>

      {/* 5. Watchlist Slide-over Drawer */}
      <WatchlistDrawer
        isOpen={isWatchlistOpen}
        onClose={() => setIsWatchlistOpen(false)}
        watchlistSymbols={watchlistSymbols}
        items={items}
        onSelectItem={(item) => setSelectedSymbol(item.symbol)}
        onRemoveFromWatchlist={handleRemoveFromWatchlist}
        alerts={alerts}
        onRemoveAlert={handleRemoveAlert}
        positions={positions}
        onClosePosition={handleClosePosition}
        onOpenSearch={() => {
          setIsWatchlistOpen(false);
          setIsSearchOpen(true);
        }}
      />

      {/* 6. Symbol Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        items={items}
        onSelectItem={(item) => setSelectedSymbol(item.symbol)}
        watchlistSymbols={watchlistSymbols}
        onToggleWatchlist={handleToggleWatchlist}
      />

      {/* 7. Paper Trade Modal */}
      {tradeModalItem && (
        <PaperTradeModal
          isOpen={Boolean(tradeModalItem)}
          onClose={() => setTradeModalItem(null)}
          item={tradeModalItem.item}
          initialSide={tradeModalItem.side}
          onExecuteTrade={handleExecuteTrade}
        />
      )}

      {/* 8. Price Alert Modal */}
      {alertModalItem && (
        <AlertModal
          isOpen={Boolean(alertModalItem)}
          onClose={() => setAlertModalItem(null)}
          item={alertModalItem}
          onAddAlert={handleAddAlert}
        />
      )}
    </div>
  );
}
