'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface GeminiInsightDisplayProps {}

const GeminiInsightDisplay: React.FC<GeminiInsightDisplayProps> = () => {
  const [stockCode, setStockCode] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [insight, setInsight] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);
    setInsight(null);

    if (!stockCode || !companyName) {
      setError('종목 코드와 회사 이름을 모두 입력해주세요.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/gemini-insight', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stockCode, companyName }),
      });

      const result = await response.json();

      if (result.success) {
        setInsight(result.insight);
      } else {
        setError(result.error || '분석 중 오류가 발생했습니다.');
      }
    } catch (err: any) {
      setError(err.message || '네트워크 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-[#28354A] border-[#3E4C66] shadow-xl">
        <CardHeader>
          <CardTitle className="text-white text-2xl">2025 투자 모멘텀 AI 분석</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="종목 코드 (예: 005930)"
              value={stockCode}
              onChange={(e) => setStockCode(e.target.value)}
              className="flex-1 bg-[#1C2534] border-[#2D3A4B] text-white placeholder-gray-500"
            />
            <Input
              placeholder="회사 이름 (예: 삼성전자)"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="flex-1 bg-[#1C2534] border-[#2D3A4B] text-white placeholder-gray-500"
            />
          </div>
          <Button
            onClick={handleAnalyze}
            disabled={isLoading}
            className="w-full bg-[#60A5FA] hover:bg-[#4A8DEB] text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              '분석 시작'
            )}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <div className="text-red-400 p-4 bg-red-900/20 rounded-lg border border-red-700">
          <p>오류: {error}</p>
        </div>
      )}

      {insight && (
        <Card className="bg-[#28354A] border-[#3E4C66] shadow-xl">
          <CardHeader>
            <CardTitle className="text-white text-xl">분석 결과</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-200 space-y-3">
            {renderInsight(insight)}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Helper function to render insight with basic markdown-like formatting
const renderInsight = (text: string) => {
  const lines = text.split('\n');
  const elements: JSX.Element[] = [];
  let currentListItems: JSX.Element[] = [];

  const processLine = (line: string, key: number) => {
    // Process bold text
    return <span key={key} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />;
  };

  lines.forEach((line, index) => {
    if (line.startsWith('## ')) {
      // If there were pending list items, render the list before the new heading
      if (currentListItems.length > 0) {
        elements.push(<ul key={`ul-prev-${index}`} className="list-disc list-inside ml-4 space-y-1">{currentListItems}</ul>);
        currentListItems = [];
      }
      elements.push(
        <h2 key={index} className="text-xl font-bold text-blue-300 mt-4 mb-2">
          {processLine(line.substring(3).trim(), index)}
        </h2>
      );
    } else if (line.startsWith('* ')) {
      // Add to current list items
      currentListItems.push(
        <li key={index} className="text-gray-300">
          {processLine(line.substring(2).trim(), index)}
        </li>
      );
    } else {
      // If there were pending list items, render the list before the new paragraph
      if (currentListItems.length > 0) {
        elements.push(<ul key={`ul-curr-${index}`} className="list-disc list-inside ml-4 space-y-1">{currentListItems}</ul>);
        currentListItems = [];
      }
      // Handle empty lines as spacers or just ignore them if desired
      if (line.trim() === '') {
        elements.push(<div key={index} className="h-2"></div>); // Spacer
      } else {
        elements.push(
          <p key={index} className="text-gray-200 leading-relaxed">
            {processLine(line.trim(), index)}
          </p>
        );
      }
    }
  });

  // Render any remaining list items at the end
  if (currentListItems.length > 0) {
    elements.push(<ul key="ul-final" className="list-disc list-inside ml-4 space-y-1">{currentListItems}</ul>);
  }

  return elements;
};

export default GeminiInsightDisplay;
