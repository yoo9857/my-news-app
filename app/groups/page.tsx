"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

interface Group {
  id: number;
  name: string;
  description: string | null;
  owner_id: number;
  created_at: string;
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await fetch('http://localhost:8003/api/groups/');
        if (!response.ok) {
          throw new Error('Failed to fetch groups');
        }
        const data = await response.json();
        setGroups(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
  }, []);

  if (loading) {
    return <div className="container mx-auto p-4 text-white">Loading groups...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-white">그룹 목록</h1>
      <div className="flex justify-end mb-4">
        <Link href="/groups/new">
          <Button>새 그룹 생성</Button>
        </Link>
      </div>
      <div className="grid gap-4">
        {groups.length === 0 ? (
          <p className="text-white">생성된 그룹이 없습니다.</p>
        ) : (
          groups.map((group) => (
            <Card key={group.id} className="bg-gray-800 text-white">
              <CardHeader>
                <CardTitle className="text-xl">
                  <Link href={`/groups/${group.id}`} className="hover:underline">
                    {group.name}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-400">{group.description || '설명 없음'}</p>
                <p className="text-xs text-gray-500">생성일: {format(new Date(group.created_at), 'yyyy-MM-dd HH:mm')}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
