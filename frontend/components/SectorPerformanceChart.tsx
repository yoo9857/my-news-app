"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const sectorData = [
  { name: '반도체', '1개월 수익률': 18.1, '3개월 수익률': 25.5 },
  { name: '2차전지', '1개월 수익률': -5.2, '3개월 수익률': -8.9 },
  { name: '바이오', '1개월 수익률': 12.7, '3개월 수익률': 15.3 },
  { name: '자동차', '1개월 수익률': 8.5, '3개월 수익률': 11.2 },
  { name: '금융', '1개월 수익률': 3.1, '3개월 수익률': 5.8 },
];

export default function SectorPerformanceChart() {
  return (
    <Card className="bg-[#1a1a1a] border border-[#333333] text-white rounded-lg shadow-lg">
      <CardHeader className="p-6">
        <CardTitle className="text-2xl font-bold text-white mb-2 border-b border-blue-600 pb-2">섹터별 수익률 비교</CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sectorData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333333" />
              <XAxis dataKey="name" stroke="#e0e0e0" tick={{ fill: '#e0e0e0' }} />
              <YAxis stroke="#e0e0e0" label={{ value: '%', position: 'insideTopLeft', offset: -10, fill: '#e0e0e0' }} tick={{ fill: '#e0e0e0' }}/>
              <Tooltip
                cursor={{ fill: 'rgba(59, 130, 246, 0.2)' }}
                contentStyle={{ backgroundColor: '#2a2a2a', border: '1px solid #444444', borderRadius: '5px' }}
                labelStyle={{ color: '#e2e8f0', fontWeight: 'bold' }}
                itemStyle={{ color: '#e2e8f0' }}
                formatter={(value: number) => `${value.toFixed(1)}%`}
              />
              <Legend
                wrapperStyle={{ color: '#e2e8f0', paddingTop: '10px' }}
                iconType="circle"
              />
              <Bar dataKey="1개월 수익률" fill="#3b82f6" barSize={30} radius={[5, 5, 0, 0]} />
              <Bar dataKey="3개월 수익률" fill="#10b981" barSize={30} radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}