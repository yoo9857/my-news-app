'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle, XCircle, Search, Loader, ServerCrash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// --- Types ---
interface Company {
  code: string; // Changed from stockCode to code to match StockInfo
  name: string;
  market: string;
  marketCap?: string;
  currentPrice?: string;
}

interface PortfolioItem extends Company {
  weight: number;
}

// --- Main Component ---
export default function PortfolioCustomizer() {
  const [allCompanies, setAllCompanies] = useState<Company[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // --- Data Fetching ---
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:8001/api/all-companies');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          // Map StockInfo to Company type for PortfolioCustomizer
          setAllCompanies(result.data.map((stock: any) => ({
            code: stock.code,
            name: stock.name,
            market: stock.market,
            marketCap: stock.market_cap ? String(stock.market_cap) : undefined, // Convert number to string
            currentPrice: stock.currentPrice ? String(stock.currentPrice) : undefined, // Convert number to string
          })));
        } else {
          throw new Error('Invalid data format received from server.');
        }
      } catch (e: any) {
        console.error("Failed to fetch company data:", e);
        setError("데이터 서버에 연결할 수 없습니다. stock-service가 실행 중인지 확인해주세요.");
      } finally {
        setLoading(false);
      }
    };
    fetchCompanies();
  }, []);

  // --- Memoized Search Results ---
  const searchResults = useMemo(() => {
    if (!searchTerm) return [];
    const lowercasedTerm = searchTerm.toLowerCase();
    return allCompanies
      .filter(company =>
        company.name.toLowerCase().includes(lowercasedTerm) ||
        company.code.includes(searchTerm)
      )
      .slice(0, 50); // Prevent rendering too many items
  }, [searchTerm, allCompanies]);

  // --- Portfolio Management ---
  const addToPortfolio = (company: Company) => {
    if (portfolio.some(item => item.code === company.code)) {
      toast({
        variant: "destructive",
        title: "종목 중복",
        description: `${company.name}은(는) 이미 포트폴리오에 존재합니다.`,
      });
      return;
    }
    setPortfolio([...portfolio, { ...company, weight: 10 }]);
    setSearchTerm('');
  };

  const removeFromPortfolio = (code: string) => {
    setPortfolio(portfolio.filter(item => item.code !== code));
  };

  const updateWeight = (code: string, newWeight: number) => {
    setPortfolio(portfolio.map(item =>
      item.code === code ? { ...item, weight: Math.max(0, Math.min(100, newWeight)) } : item
    ));
  };
  
  const totalWeight = useMemo(() => portfolio.reduce((sum, item) => sum + item.weight, 0), [portfolio]);

  // --- Render ---
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
      {/* Search & Results Column */}
      <Card className="lg:col-span-1 bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-300">종목 검색</CardTitle>
          <CardDescription className="text-sm text-slate-400">포트폴리오에 추가할 종목을 찾아보세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
            <Input
              placeholder="종목명 또는 코드로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-900/80 border-slate-600 text-white"
            />
          </div>
          <ScrollArea className="h-[400px] pr-4">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <Loader className="h-8 w-8 text-indigo-400 animate-spin" />
              </div>
            ) : error ? (
              <div className="text-center text-red-400 flex flex-col items-center h-full justify-center">
                <ServerCrash className="h-10 w-10 mb-4" />
                <p className="font-semibold">데이터 로딩 실패</p>
                <p className="text-xs mt-2">{error}</p>
              </div>
            ) : searchResults.length > 0 ? (
              <ul className="space-y-2">
                {searchResults.map(company => (
                  <li key={company.code} className="flex items-center justify-between p-2 rounded-md bg-slate-900/50 hover:bg-slate-700/50 transition-colors">
                    <div>
                      <p className="font-semibold text-slate-200">{company.name}</p>
                      <p className="text-xs text-slate-500">{company.code} &middot; {company.market}</p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => addToPortfolio(company)}>
                      <PlusCircle className="h-5 w-5 text-green-400" />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center pt-16 text-slate-500">
                <p>{searchTerm ? "검색 결과가 없습니다." : "검색을 시작해보세요."}</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Portfolio Column */}
      <Card className="lg:col-span-2 bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg font-semibold text-slate-300">나만의 포트폴리오</CardTitle>
              <CardDescription className="text-sm text-slate-400">
                총 비중: <span className={`font-bold ${totalWeight > 100 ? 'text-red-500' : 'text-green-400'}`}>{totalWeight}%</span>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[450px] pr-4">
            {portfolio.length > 0 ? (
              <ul className="space-y-3">
                {portfolio.map(item => (
                  <motion.li
                    key={item.code}
                    layout
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700/50"
                  >
                    <div className="w-1/3">
                      <p className="font-bold text-indigo-400">{item.name}</p>
                      <p className="text-xs text-slate-500">{item.code}</p>
                    </div>
                    <div className="flex items-center w-2/3">
                      <Input
                        type="number"
                        value={item.weight}
                        onChange={(e) => updateWeight(item.code, parseInt(e.target.value, 10) || 0)}
                        className="w-20 text-center bg-slate-800 border-slate-600"
                        min="0"
                        max="100"
                      />
                      <span className="ml-2 text-slate-400">%</span>
                      <div className="flex-grow ml-4">
                         <Input
                            type="range"
                            min="0"
                            max="100"
                            value={item.weight}
                            onChange={(e) => updateWeight(item.code, parseInt(e.target.value, 10))}
                            className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                          />
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => removeFromPortfolio(item.code)} className="ml-4">
                        <XCircle className="h-5 w-5 text-red-500" />
                      </Button>
                    </div>
                  </motion.li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-20 text-slate-500">
                <p>검색하여 포트폴리오에 종목을 추가하세요.</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
