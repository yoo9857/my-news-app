"use client"

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calculator, Percent, Crosshair, Anchor } from "lucide-react";

// 복리 계산 차트 컴포넌트
function CompoundInterestChart() {
  const [initial, setInitial] = useState(10000000);
  const [monthly, setMonthly] = useState(500000);
  const [rate, setRate] = useState(8);
  const [period, setPeriod] = useState(20);
  const [chartData, setChartData] = useState<any[]>([]);
  const [result, setResult] = useState({ principal: 0, finalAsset: 0 });

  const calculate = () => {
    const annualRate = rate / 100;
    const monthlyRate = annualRate / 12;
    const totalMonths = period * 12;

    let total = initial;
    let totalPrincipal = initial;
    const data = [];

    for (let i = 1; i <= totalMonths; i++) {
      total = (total + monthly) * (1 + monthlyRate);
      totalPrincipal += monthly;
      if (i % 12 === 0 || i === 1) { // 1년 단위로 데이터 추가
        data.push({
          year: Math.floor(i / 12),
          asset: Math.round(total),
          principal: Math.round(totalPrincipal)
        });
      }
    }
     if (totalMonths % 12 !== 0) {
        data.push({
          year: period,
          asset: Math.round(total),
          principal: Math.round(totalPrincipal)
        });
      }


    setChartData(data);
    setResult({ principal: totalPrincipal, finalAsset: total });
  };

  useEffect(() => {
    calculate();
  }, []); // 컴포넌트 마운트 시 한번 계산

  return (
    <Card className="bg-gray-800 border-gray-700 text-white lg:col-span-3">
      <CardHeader>
        <CardTitle className="text-xl text-white flex items-center"><Calculator className="mr-2 h-5 w-5"/>복리 마법 계산기</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div>
              <label htmlFor="initial-investment" className="block text-sm font-medium text-gray-300">초기 투자금 (원)</label>
              <Input id="initial-investment" type="number" value={initial} onChange={(e) => setInitial(Number(e.target.value))} className="calc-input mt-1" />
            </div>
            <div>
              <label htmlFor="monthly-investment" className="block text-sm font-medium text-gray-300">매월 추가 투자금 (원)</label>
              <Input id="monthly-investment" type="number" value={monthly} onChange={(e) => setMonthly(Number(e.target.value))} className="calc-input mt-1" />
            </div>
            <div>
              <label htmlFor="annual-return" className="block text-sm font-medium text-gray-300">연평균 수익률 (%)</label>
              <Input id="annual-return" type="number" value={rate} onChange={(e) => setRate(Number(e.target.value))} className="calc-input mt-1" />
            </div>
            <div>
              <label htmlFor="investment-period" className="block text-sm font-medium text-gray-300">투자 기간 (년)</label>
              <Input id="investment-period" type="number" value={period} onChange={(e) => setPeriod(Number(e.target.value))} className="calc-input mt-1" />
            </div>
            <Button onClick={calculate} className="w-full bg-blue-600 hover:bg-blue-700">시뮬레이션</Button>
          </div>
          <div className="min-h-[300px]">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                <XAxis dataKey="year" stroke="#cbd5e0" unit="년"/>
                <YAxis stroke="#cbd5e0" tickFormatter={(value) => `${(value / 100000000).toFixed(1)}억`} />
                <Tooltip
                    contentStyle={{ backgroundColor: '#1a202c', border: '1px solid #4a5568' }}
                    labelStyle={{ color: '#e2e8f0' }}
                    formatter={(value: number) => `${value.toLocaleString()}원`}
                />
                <Legend wrapperStyle={{ color: '#e2e8f0' }} />
                <Line type="monotone" dataKey="asset" name="총 자산" stroke="#4ade80" />
                <Line type="monotone" dataKey="principal" name="총 원금" stroke="#9ca3af" />
              </LineChart>
            </ResponsiveContainer>
             <div className="text-center mt-4 space-y-1">
                <p className="text-gray-300">총 원금: <span className="font-bold text-white">{result.principal.toLocaleString()}원</span></p>
                <p className="text-gray-300">최종 자산: <span className="font-bold text-green-400 text-lg">{result.finalAsset.toLocaleString()}원</span></p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// 수익률 계산기
function ReturnCalculator() {
    const [buyPrice, setBuyPrice] = useState('');
    const [sellPrice, setSellPrice] = useState('');
    const [result, setResult] = useState<string | null>(null);

    const calculate = () => {
        const buy = parseFloat(buyPrice);
        const sell = parseFloat(sellPrice);
        if(isNaN(buy) || isNaN(sell) || buy <= 0) {
            setResult('유효한 값을 입력하세요.');
            return;
        }
        const rate = ((sell - buy) / buy) * 100;
        setResult(`${rate.toFixed(2)}%`);
    };

    const resultColor = result ? (result.includes('-') ? 'text-blue-400' : 'text-red-400') : 'text-white';

    return (
        <Card className="bg-gray-800 border-gray-700 text-white">
            <CardHeader>
                <CardTitle className="text-xl text-white flex items-center"><Percent className="mr-2 h-5 w-5"/>수익률 계산기</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <label htmlFor="buy-price" className="block text-sm font-medium text-gray-300">매수가 (원)</label>
                    <Input id="buy-price" type="number" value={buyPrice} onChange={(e) => setBuyPrice(e.target.value)} className="calc-input mt-1" placeholder="예: 10000"/>
                </div>
                <div>
                    <label htmlFor="sell-price" className="block text-sm font-medium text-gray-300">매도가 (원)</label>
                    <Input id="sell-price" type="number" value={sellPrice} onChange={(e) => setSellPrice(e.target.value)} className="calc-input mt-1" placeholder="예: 12000"/>
                </div>
                <Button onClick={calculate} className="w-full bg-blue-600 hover:bg-blue-700">계산하기</Button>
                <p className="text-center text-white text-lg">수익률: <span className={`font-bold ${resultColor}`}>{result}</span></p>
            </CardContent>
        </Card>
    );
}

// 목표가 계산기
function TargetPriceCalculator() {
    const [currentPrice, setCurrentPrice] = useState('');
    const [targetReturn, setTargetReturn] = useState('');
    const [result, setResult] = useState<string | null>(null);

    const calculate = () => {
        const current = parseFloat(currentPrice);
        const target = parseFloat(targetReturn);
        if(isNaN(current) || isNaN(target)) {
            setResult('유효한 값을 입력하세요.');
            return;
        }
        const targetPrice = current * (1 + target / 100);
        setResult(`${Math.round(targetPrice).toLocaleString()}원`);
    };

    return (
        <Card className="bg-gray-800 border-gray-700 text-white">
            <CardHeader>
                <CardTitle className="text-xl text-white flex items-center"><Crosshair className="mr-2 h-5 w-5"/>목표가 계산기</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <label htmlFor="current-price" className="block text-sm font-medium text-gray-300">현재가/매수가 (원)</label>
                    <Input id="current-price" type="number" value={currentPrice} onChange={(e) => setCurrentPrice(e.target.value)} className="calc-input mt-1" placeholder="예: 50000"/>
                </div>
                <div>
                    <label htmlFor="target-return" className="block text-sm font-medium text-gray-300">목표 수익률 (%)</label>
                    <Input id="target-return" type="number" value={targetReturn} onChange={(e) => setTargetReturn(e.target.value)} className="calc-input mt-1" placeholder="예: 20"/>
                </div>
                <Button onClick={calculate} className="w-full bg-blue-600 hover:bg-blue-700">계산하기</Button>
                <p className="text-center text-white text-lg">목표가: <span className="font-bold">{result}</span></p>
            </CardContent>
        </Card>
    );
}

// 평단가 계산기
function AverageDownCalculator() {
    const [oldPrice, setOldPrice] = useState('');
    const [oldQty, setOldQty] = useState('');
    const [newPrice, setNewPrice] = useState('');
    const [newQty, setNewQty] = useState('');
    const [result, setResult] = useState<string | null>(null);

    const calculate = () => {
        const oPrice = parseFloat(oldPrice);
        const oQty = parseInt(oldQty);
        const nPrice = parseFloat(newPrice);
        const nQty = parseInt(newQty);

        if(isNaN(oPrice) || isNaN(oQty) || isNaN(nPrice) || isNaN(nQty) || oQty < 0 || nQty < 0) {
            setResult('유효한 값을 입력하세요.');
            return;
        }

        const totalAmount = (oPrice * oQty) + (nPrice * nQty);
        const totalQty = oQty + nQty;
        const avgPrice = totalQty > 0 ? totalAmount / totalQty : 0;
        setResult(`${Math.round(avgPrice).toLocaleString()}원`);
    };

    return (
        <Card className="bg-gray-800 border-gray-700 text-white">
            <CardHeader>
                <CardTitle className="text-xl text-white flex items-center"><Anchor className="mr-2 h-5 w-5"/>평단가 계산기 (물타기)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <label htmlFor="old-price" className="block text-sm font-medium text-gray-300">기존 평단가</label>
                    <Input id="old-price" type="number" value={oldPrice} onChange={(e) => setOldPrice(e.target.value)} className="calc-input mt-1" placeholder="예: 100000"/>
                </div>
                <div>
                    <label htmlFor="old-qty" className="block text-sm font-medium text-gray-300">기존 보유 수량</label>
                    <Input id="old-qty" type="number" value={oldQty} onChange={(e) => setOldQty(e.target.value)} className="calc-input mt-1" placeholder="예: 10"/>
                </div>
                 <div>
                    <label htmlFor="new-price" className="block text-sm font-medium text-gray-300">추가 매수가</label>
                    <Input id="new-price" type="number" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} className="calc-input mt-1" placeholder="예: 80000"/>
                </div>
                <div>
                    <label htmlFor="new-qty" className="block text-sm font-medium text-gray-300">추가 매수 수량</label>
                    <Input id="new-qty" type="number" value={newQty} onChange={(e) => setNewQty(e.target.value)} className="calc-input mt-1" placeholder="예: 5"/>
                </div>
                <Button onClick={calculate} className="w-full bg-blue-600 hover:bg-blue-700">계산하기</Button>
                <p className="text-center text-white text-lg">최종 평단가: <span className="font-bold">{result}</span></p>
            </CardContent>
        </Card>
    );
}

// 전체 계산기들을 묶는 메인 컴포넌트
export default function InvestmentCalculators() {
  return (
    <div className="space-y-8">
      <CompoundInterestChart />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <ReturnCalculator />
        <TargetPriceCalculator />
        <AverageDownCalculator />
      </div>
    </div>
  )
}