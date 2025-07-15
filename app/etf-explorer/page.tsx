'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from 'lucide-react';

interface Etf {
  code: string;
  name: string;
}

interface EtfHolding {
  stock_code: string;
  stock_name: string;
  weight: number;
}

export default function EtfExplorerPage() {
  const [etfs, setEtfs] = useState<Etf[]>([]);
  const [selectedEtf, setSelectedEtf] = useState<string | null>(null);
  const [holdings, setHoldings] = useState<EtfHolding[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEtfs = async () => {
      const response = await fetch('/api/etfs');
      const data = await response.json();
      if (data.success) {
        setEtfs(data.data);
        if (data.data.length > 0) {
          setSelectedEtf(data.data[0].code);
        }
      }
      setIsLoading(false);
    };
    fetchEtfs();
  }, []);

  useEffect(() => {
    if (!selectedEtf) return;
    const fetchHoldings = async () => {
      setIsLoading(true);
      const response = await fetch(`/api/etfs/${selectedEtf}`);
      const data = await response.json();
      if (data.success) {
        setHoldings(data.data);
      }
      setIsLoading(false);
    };
    fetchHoldings();
  }, [selectedEtf]);

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">ETF 탐색기</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="md:col-span-1">
          <CardHeader><CardTitle>ETF 선택</CardTitle></CardHeader>
          <CardContent>
            <Select onValueChange={setSelectedEtf} value={selectedEtf || ''}>
              <SelectTrigger>
                <SelectValue placeholder="ETF를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {etfs.map(etf => (
                  <SelectItem key={etf.code} value={etf.code}>{etf.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader><CardTitle>구성 종목</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>종목명</TableHead>
                    <TableHead className="text-right">비중</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {holdings.map(h => (
                    <TableRow key={h.stock_code}>
                      <TableCell>{h.stock_name} ({h.stock_code})</TableCell>
                      <TableCell className="text-right">{h.weight?.toFixed(2)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
