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
    <Card className="bg-gray-800 border-gray-700 text-white">
      <CardHeader>
        <CardTitle className="text-xl text-white">섹터별 수익률 비교</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sectorData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
              <XAxis dataKey="name" stroke="#cbd5e0" />
              <YAxis stroke="#cbd5e0" label={{ value: '%', position: 'insideTopLeft', offset: -10, fill: '#cbd5e0' }}/>
              <Tooltip
                contentStyle={{ backgroundColor: '#1a202c', border: '1px solid #4a5568' }}
                labelStyle={{ color: '#e2e8f0' }}
                formatter={(value: number) => `${value.toFixed(1)}%`}
              />
              <Legend wrapperStyle={{ color: '#e2e8f0' }} />
              <Bar dataKey="1개월 수익률" fill="#8884d8" />
              <Bar dataKey="3개월 수익률" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}