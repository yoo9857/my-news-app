'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button'; // Button 컴포넌트 추가
import { Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'; // Resizable 컴포넌트 추가
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"; // Added AlertDialog components

// 타입 정의
interface Company {
  theme: string;
  name: string;
  stockCode: string;
  reason: string;
  bull: string;
  bear: string;
  marketCap?: string;
  per?: string;
  currentPrice?: string;
  highPrice?: string;
  lowPrice?: string;
  openingPrice?: string;
  change?: string;
  changeRate?: string;
}

interface StockData {
  code: string;
  name: string;
  current_price: number;
  change: number;
  change_rate: number;
  status: 'positive' | 'negative' | 'neutral';
}

interface CompanyExplorerProps {
  stockData: Record<string, StockData>;
  isConnected: boolean;
}

export default function CompanyExplorer({ stockData, isConnected }: CompanyExplorerProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [themes, setThemes] = useState<string[]>(['전체']);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState('전체');
  const [searchTerm, setSearchTerm] = useState('');
  const [geminiInsight, setGeminiInsight] = useState<string | null>(null);
  const [showGeminiInsightDialog, setShowGeminiInsightDialog] = useState(false);
  const [loadingGeminiInsight, setLoadingGeminiInsight] = useState(false);
  const [currentInsightCompany, setCurrentInsightCompany] = useState<{ name: string; stockCode: string } | null>(null);
  const [hasUserClosedDialog, setHasUserClosedDialog] = useState(false);

  useEffect(() => {
    const fetchCompanyData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('http://127.0.0.1:8000/api/all-companies');
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        if (data.success) {
          setCompanies(data.data);
          const uniqueThemes = ['전체', ...Array.from(new Set(data.data.map((c: Company) => c.theme)))];
          setThemes(uniqueThemes as string[]);
        } else {
          throw new Error(data.message || 'Failed to fetch company data.');
        }
      } catch (err: any) {
        console.error('Error fetching company data:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanyData();
  }, []);

  const handleGetGeminiInsight = async (stockCode: string, companyName: string) => {
    setLoadingGeminiInsight(true);
    setGeminiInsight(null);
    setCurrentInsightCompany({ name: companyName, stockCode: stockCode });
    setHasUserClosedDialog(false);
    setShowGeminiInsightDialog(true);

    try {
      const response = await fetch('/api/gemini-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockCode, companyName }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (data.success) {
        setGeminiInsight(data.insight);
      } else {
        setGeminiInsight(data.error || "Failed to get Gemini insight.");
      }
    } catch (error) {
      console.error("Error fetching Gemini insight:", error);
      setGeminiInsight("An error occurred while fetching Gemini insight.");
    } finally {
      setLoadingGeminiInsight(false);
    }
  };

  const filteredCompanies = useMemo(() => {
    let currentCompanies = companies;
    if (selectedTheme !== '전체') {
      currentCompanies = currentCompanies.filter(company => company.theme === selectedTheme);
    }
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      currentCompanies = currentCompanies.filter(
        company => company.name.toLowerCase().includes(lowerCaseSearchTerm) || company.stockCode.includes(lowerCaseSearchTerm)
      );
    }
    return currentCompanies;
  }, [companies, selectedTheme, searchTerm]);

  const getStatusVisuals = (status: 'positive' | 'negative' | 'neutral') => {
    switch (status) {
      case 'positive': return { icon: <TrendingUp className="h-5 w-5 text-red-400" />, color: 'text-red-400' };
      case 'negative': return { icon: <TrendingDown className="h-5 w-5 text-blue-400" />, color: 'text-blue-400' };
      default: return { icon: <Minus className="h-5 w-5 text-gray-500" />, color: 'text-gray-300' };
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-180px)] text-white">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
        <p className="mt-4 text-lg">기업 정보를 로딩 중입니다...</p>
        <p className="text-sm text-gray-400">잠시만 기다려주세요.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-180px)] text-center text-red-400">
        <p className="text-xl font-bold">오류: 기업 정보를 불러오는 데 실패했습니다.</p>
        <p className="text-md mt-2">{error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white">
          페이지 새로고침
        </Button>
      </div>
    );
  }

  return (
    <React.Fragment>
      <div className="space-y-6 h-[calc(100vh-180px)]">
        <ResizablePanelGroup direction="horizontal" className="min-h-[500px] rounded-lg border border-[#333333]">
          <ResizablePanel defaultSize={25} minSize={15}>
            <Card className="h-full bg-[#1a1a1a] border-none rounded-lg shadow-lg flex flex-col">
              <CardHeader className="p-4 pb-2 border-b border-[#333333">
                <CardTitle className="text-lg font-semibold text-white">테마 목록</CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-grow overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-2 space-y-1">
                    {themes.map(theme => {
                      const displayThemeName = theme.includes('|') ? theme.split('|')[1] : theme;
                      return (
                        <Button
                          key={theme}
                          variant="ghost"
                          className={`w-full justify-start text-left text-sm font-medium transition-colors duration-200 ${
                            selectedTheme === theme ? 'bg-blue-600 text-white hover:bg-blue-700' : 'text-gray-300 hover:bg-[#2a2a2a]'
                          }`}
                          onClick={() => setSelectedTheme(theme)}
                        >
                          {displayThemeName}
                        </Button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </ResizablePanel>

          <ResizableHandle withHandle className="bg-[#333333] hover:bg-blue-600 transition-colors duration-200" />

          <ResizablePanel defaultSize={75} minSize={50}>
            <Card className="h-full bg-[#1a1a1a] border-none rounded-lg shadow-lg flex flex-col">
              <CardHeader className="p-4 pb-2 border-b border-[#333333]">
                <CardTitle className="text-lg font-semibold text-white mb-3">
                  {selectedTheme === '전체' ? '전체 기업' : `${selectedTheme.includes('|') ? selectedTheme.split('|')[1] : selectedTheme} 테마 기업`}
                </CardTitle>
                <Input
                  type="text"
                  placeholder="기업명, 종목코드 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#2a2a2a] border border-[#444444] text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-md py-2"
                />
              </CardHeader>
              <CardContent className="p-4 flex-grow overflow-hidden">
                <ScrollArea className="h-full">
                  {filteredCompanies.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">
                      <p>표시할 기업 정보가 없습니다.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {filteredCompanies.map(company => {
                        const realTimeData = stockData[company.stockCode];
                        const visuals = getStatusVisuals(realTimeData?.status);
                        return (
                          <Card key={`${company.theme}-${company.stockCode}`} className="bg-[#1a1a1a] border border-[#333333] rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col overflow-hidden">
                            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between border-b border-[#333333]">
                              <div className="flex flex-col">
                                <Badge className="bg-blue-700 text-white px-2 py-0.5 rounded-full text-xs mb-1 self-start">
                                  {company.theme.includes('|') ? company.theme.split('|')[1] : company.theme}
                                </Badge>
                                <CardTitle className="text-lg font-semibold text-white leading-tight">{company.name} ({company.stockCode})</CardTitle>
                              </div>
                              {isConnected && realTimeData && (
                                <div className="text-right flex-shrink-0">
                                  <p className={`text-xl font-bold ${visuals.color}`}>{realTimeData.current_price.toLocaleString()}원</p>
                                  <div className={`flex items-center justify-end gap-1 text-sm ${visuals.color}`}>
                                    {visuals.icon}
                                    <span>{realTimeData.change.toLocaleString()} ({realTimeData.change_rate.toFixed(2)}%)</span>
                                  </div>
                                </div>
                              )}
                            </CardHeader>
                            <CardContent className="p-4 pt-3 flex-grow flex flex-col justify-between">
                              <div>
                                <div className="mb-4">
                                  <h4 className="text-sm font-semibold text-gray-400 mb-2">주요 지표</h4>
                                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-300">
                                    {company.currentPrice && <p>현재가: <span className="font-semibold text-white">{parseInt(company.currentPrice).toLocaleString()}원</span></p>}
                                    {company.marketCap && <p>시가총액: <span className="font-semibold text-white">{parseInt(company.marketCap).toLocaleString()}억</span></p>}
                                    {company.per && <p>PER: <span className="font-semibold text-white">{company.per}</span></p>}
                                  </div>
                                </div>
                                {(company.reason || company.bull || company.bear) && (
                                  <div>
                                    <h4 className="text-sm font-semibold text-gray-400 mb-2">투자 인사이트</h4>
                                    <CardDescription className="text-gray-300 text-sm mb-2 line-clamp-2">{company.reason}</CardDescription>
                                  </div>
                                )}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-3 w-full bg-[#2a2a2a] border-[#444444] text-gray-100 hover:bg-[#3a3a3a]"
                                onClick={() => handleGetGeminiInsight(company.stockCode, company.name)}
                              >
                                2025년 투자 모멘텀
                              </Button>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <AlertDialog open={showGeminiInsightDialog} onOpenChange={(open) => { if (!open) setHasUserClosedDialog(true); setShowGeminiInsightDialog(open); }}>
        <AlertDialogContent className="bg-gradient-to-br from-[#1A202C] to-[#2D3748] border border-[#4A5568] text-gray-100 max-w-lg max-h-[80vh] overflow-y-auto rounded-xl shadow-2xl">
          <AlertDialogHeader className="p-6 pb-4 border-b border-[#4A5568]">
            <AlertDialogTitle className="text-white text-2xl font-extrabold leading-tight">
              {currentInsightCompany ? `${currentInsightCompany.name} (${currentInsightCompany.stockCode})` : ''} 2025년 투자 모멘텀
            </AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription asChild>
            <ScrollArea className="max-h-[50vh] p-6 pt-4">
              {loadingGeminiInsight ? (
                <div className="flex items-center justify-center py-8 text-blue-400">
                  <Loader2 className="mr-3 h-6 w-6 animate-spin" /> 정보 수집중...
                </div>
              ) : (
                geminiInsight ? renderInsight(geminiInsight) : "분석 결과를 불러올 수 없습니다."
              )}
            </ScrollArea>
          </AlertDialogDescription>
          <AlertDialogFooter className="p-6 pt-4 border-t border-[#4A5568]">
            <AlertDialogAction className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-5 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg" onClick={() => setShowGeminiInsightDialog(false)}>닫기</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </React.Fragment>
  );
}

const renderInsight = (text: string) => {
  const lines = text.split('\n');
  const elements: JSX.Element[] = [];
  let currentListItems: JSX.Element[] = [];

  const processLine = (line: string, key: number) => {
    return <span key={key} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />;
  };

  const flushList = (key: string) => {
    if (currentListItems.length > 0) {
      elements.push(<ul key={key} className="list-disc list-inside ml-4 space-y-1">{currentListItems}</ul>);
      currentListItems = [];
    }
  };

  lines.forEach((line, index) => {
    if (line.startsWith('## ')) {
      flushList(`ul-prev-${index}`);
      elements.push(
        <h2 key={index} className="text-xl font-bold text-blue-300 mt-4 mb-2">
          {processLine(line.substring(3).trim(), index)}
        </h2>
      );
    } else if (line.startsWith('* ')) {
      currentListItems.push(
        <li key={index} className="text-gray-300 leading-relaxed">
          {processLine(line.substring(2).trim(), index)}
        </li>
      );
    } else {
      flushList(`ul-curr-${index}`);
      if (line.trim() !== '') {
        elements.push(
          <p key={index} className="text-gray-200 leading-relaxed">
            {processLine(line.trim(), index)}
          </p>
        );
      }
    }
  });

  flushList('ul-final');
  return <div className="space-y-4">{elements}</div>;
}
