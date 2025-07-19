"use client";

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';

interface DailyStat {
  date: string;
  unique_visitors: number;
}

interface TopPath {
  path: string;
  visits: number;
}

interface TopUserAgent {
  user_agent: string;
  visits: number;
}

interface TrafficStats {
  daily_stats: DailyStat[];
  top_paths: TopPath[];
  top_user_agents: TopUserAgent[];
}

export default function TrafficPage() {
  const [secretKey, setSecretKey] = useState('');
  const [trafficStats, setTrafficStats] = useState<TrafficStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchTrafficStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_ADMIN_API_URL}/api/traffic_stats`, {
        headers: {
          'secret-key': secretKey,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch traffic stats');
      }

      const data = await response.json();
      setTrafficStats(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Traffic Statistics</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Access with Secret Key</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Input
              type="password"
              placeholder="Enter Secret Key"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              className="flex-grow"
            />
            <Button onClick={fetchTrafficStats} disabled={loading || !secretKey}>
              {loading ? 'Loading...' : 'Fetch Stats'}
            </Button>
          </div>
          {error && <p className="text-red-500 mt-2">{error}</p>}
        </CardContent>
      </Card>

      {trafficStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Daily Unique Visitors</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Visitors</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trafficStats.daily_stats.map((stat) => (
                    <TableRow key={stat.date}>
                      <TableCell>{stat.date}</TableCell>
                      <TableCell>{stat.unique_visitors}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Paths</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Path</TableHead>
                    <TableHead>Visits</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trafficStats.top_paths.map((path) => (
                    <TableRow key={path.path}>
                      <TableCell>{path.path}</TableCell>
                      <TableCell>{path.visits}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top User Agents</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User Agent</TableHead>
                    <TableHead>Visits</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trafficStats.top_user_agents.map((ua) => (
                    <TableRow key={ua.user_agent}>
                      <TableCell>{ua.user_agent}</TableCell>
                      <TableCell>{ua.visits}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}