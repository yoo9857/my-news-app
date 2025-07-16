'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StockInfo } from '@/lib/types';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Loader2, AlertTriangle, ArrowUp, ArrowDown, ChevronsUpDown } from 'lucide-react';

type SortKey = keyof StockInfo | 'currentPrice' | 'change_rate' | 'volume';

const getChangeRateColor = (rate: number) => {
  if (rate > 0) return 'text-green-400';
  if (rate < 0) return 'text-red-400';
  return 'text-slate-400';
};

const ChangeRateIcon = ({ rate }: { rate: number }) => {
  if (rate > 0) return <ArrowUp size={14} className="inline-block mr-1 text-green-400" />;
  if (rate < 0) return <ArrowDown size={14} className="inline-block mr-1 text-red-400" />;
  return null;
};

const SortableListHeader = ({ sortConfig, requestSort }: {
  sortConfig: { key: SortKey; direction: 'ascending' | 'descending' } | null;
  requestSort: (key: SortKey) => void;
}) => {
  const headers: { key: SortKey; label: string; className: string }[] = [
    { key: 'name', label: '종목명', className: 'w-[40%] cursor-pointer' },
    { key: 'currentPrice', label: '현재가', className: 'w-[20%] text-right cursor-pointer' },
    { key: 'change_rate', label: '등락률', className: 'w-[20%] text-right cursor-pointer' },
    { key: 'volume', label: '거래량', className: 'w-[20%] text-right cursor-pointer' },
  ];

  const getSortIcon = (key: SortKey) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ChevronsUpDown size={14} className="inline-block ml-1 text-slate-500" />;
    }
    return sortConfig.direction === 'ascending' ? 
      <ArrowUp size={14} className="inline-block ml-1" /> : 
      <ArrowDown size={14} className="inline-block ml-1" />;
  };

  return (
    <div className="flex items-center bg-slate-900/80 flex-shrink-0 h-12 px-4 border-b border-slate-700 font-semibold text-slate-300 text-sm select-none">
      {headers.map(({ key, label, className }) => (
        <div key={key} className={className} onClick={() => requestSort(key)}>
          {label}
          {getSortIcon(key)}
        </div>
      ))}
    </div>
  );
};

// Function to check if the Korean stock market is open
const isMarketOpenInKorea = () => {
  const now = new Date();
  const kstOffset = 9 * 60; // KST is UTC+9
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const kstNow = new Date(utc + (kstOffset * 60000));

  const dayOfWeek = kstNow.getDay(); // 0 = Sunday, 6 = Saturday
  const hour = kstNow.getHours();
  const minute = kstNow.getMinutes();

  // Market is open on weekdays (Monday to Friday)
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return false;
  }

  // Market hours: 9:00 AM to 3:30 PM
  const marketOpen = hour > 9 || (hour === 9 && minute >= 0);
  const marketClose = hour < 15 || (hour === 15 && minute <= 30);

  return marketOpen && marketClose;
};

export default function CompanyExplorer() {
  const [searchTerm, setSearchTerm] = useState('');
  const [marketFilter, setMarketFilter] = useState<'ALL' | 'KOSPI' | 'KOSDAQ'>('ALL');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'ascending' | 'descending' }>({ key: 'volume', direction: 'descending' });

  const [stocks, setStocks] = useState<StockInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      setFetchError(false);
      try {
        const response = await fetch('/data/stocks.json');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        // The JSON file is an array of stock objects directly
        if (Array.isArray(result)) {
          setStocks(result);
        } else {
          setFetchError(true);
        }
      } catch (error) {
        console.error("Failed to fetch initial stock data:", error);
        setFetchError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();

    // WebSocket for real-time price updates, ONLY if market is open
    if (isMarketOpenInKorea()) {
      console.log("Market is open. Attempting WebSocket connection...");
      if (!socketRef.current || socketRef.current.readyState === WebSocket.CLOSED) {
        const wsUrl = process.env.NEXT_PUBLIC_STOCK_API_URL?.replace(/^http/, 'ws');
        const socket = new WebSocket(`${wsUrl}/ws/realtime-price`);
        socketRef.current = socket;

        socket.onopen = () => {
          console.log("CompanyExplorer: WebSocket connection successful");
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'realtime-price') {
              setStocks(prevStocks =>
                prevStocks.map(stock =>
                  stock.code === data.code
                    ? { ...stock, currentPrice: data.price, change_rate: data.change_rate }
                    : stock
                )
              );
            }
          } catch (e) {
            console.error('CompanyExplorer: Error processing WebSocket message:', e);
          }
        };

        socket.onerror = (error) => {
          console.error('CompanyExplorer: WebSocket Error:', error);
        };

        socket.onclose = (event) => {
          console.log('CompanyExplorer: WebSocket connection closed:', event.reason);
          socketRef.current = null; // Allow reconnection
        };
      }
    } else {
      console.log("Market is closed. Skipping WebSocket connection.");
    }

    return () => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.close();
      }
    };
  }, []);

  const requestSort = (key: SortKey) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedAndFilteredCompanies = useMemo(() => {
    let filtered = [...stocks];

    if (marketFilter !== 'ALL') {
      filtered = filtered.filter(stock => stock.market === marketFilter);
    }

    if (debouncedSearchTerm) {
      const lowercasedTerm = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(stock =>
        (stock.name && stock.name.toLowerCase().includes(lowercasedTerm)) ||
        (stock.code && stock.code.includes(debouncedSearchTerm))
      );
    }

    if (sortConfig !== null) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof StockInfo] || 0;
        const bValue = b[sortConfig.key as keyof StockInfo] || 0;
        if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [stocks, debouncedSearchTerm, marketFilter, sortConfig]);

  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: sortedAndFilteredCompanies.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 52,
    overscan: 10,
  });

  const renderContent = () => {
    if (isLoading) {
      return <div className="flex items-center justify-center h-48"><Loader2 className="animate-spin text-slate-400" size={32} /></div>;
    }
    if (fetchError) {
      return <div className="flex flex-col items-center justify-center h-48 text-red-400"><AlertTriangle size={32} /><p className="mt-2">데이터를 불러오는 데 실패했습니다.</p></div>;
    }
    if (sortedAndFilteredCompanies.length === 0) {
      return <div className="flex items-center justify-center h-48 text-slate-400">검색 결과가 없습니다.</div>;
    }
    return (
      <div ref={parentRef} className="flex-grow overflow-auto" style={{ height: 'calc(100vh - 300px)' }}>
        <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
          {rowVirtualizer.getVirtualItems().map(virtualItem => {
            const stock = sortedAndFilteredCompanies[virtualItem.index];
            const currentPrice = stock.currentPrice || 0;
            const rate = stock.change_rate || 0;
            const volume = stock.volume || 0;
            return (
              <a href={`/stock/${stock.code}`} key={virtualItem.key} target="_blank" rel="noopener noreferrer">
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                  className="flex items-center px-4 border-b border-slate-800 hover:bg-slate-800/50 transition-colors duration-150"
                >
                  <div className="w-[40%] font-medium text-slate-200 truncate">
                    {stock.name} <span className="text-slate-500 text-xs">({stock.code})</span>
                  </div>
                  <div className="w-[20%] text-right text-slate-200 font-mono">{currentPrice.toLocaleString()}원</div>
                  <div className={`w-[20%] text-right font-semibold ${getChangeRateColor(rate)}`}>
                    <ChangeRateIcon rate={rate} />
                    {rate.toFixed(2)}%
                  </div>
                  <div className="w-[20%] text-right text-slate-400 font-mono">{volume.toLocaleString()}</div>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <Input 
          placeholder="종목명 또는 코드로 검색..." 
          value={searchTerm} 
          onChange={e => setSearchTerm(e.target.value)}
          className="flex-grow bg-slate-800 border-slate-600 text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500"
        />
        <Tabs defaultValue="ALL" onValueChange={(value) => setMarketFilter(value as any)} className="w-full sm:w-auto">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800 border-slate-600">
            <TabsTrigger value="ALL">전체</TabsTrigger>
            <TabsTrigger value="KOSPI">코스피</TabsTrigger>
            <TabsTrigger value="KOSDAQ">코스닥</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-grow rounded-lg border border-slate-700/50 overflow-hidden flex flex-col">
        <SortableListHeader sortConfig={sortConfig} requestSort={requestSort} />
        {renderContent()}
      </div>
    </div>
  );
}