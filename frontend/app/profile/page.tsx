'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function ProfilePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <Card className="bg-gray-800 border-gray-700 text-white shadow-lg rounded-lg overflow-hidden">
          <CardHeader className="relative h-48 bg-cover bg-center" style={{ backgroundImage: `url(${user.avatar_url || '/placeholder-background.jpg'})` }}>
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                <AvatarImage src={user.avatar_url || undefined} alt={user.username} />
                <AvatarFallback className="text-5xl font-bold bg-indigo-600 text-white">
                  {user.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="text-center">
              <CardTitle className="text-3xl font-bold mb-1">{user.nickname || user.username}</CardTitle>
              <p className="text-gray-400">{user.email}</p>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Bio</Label>
              <p className="text-gray-200">{user.bio || '아직 자기소개가 없습니다.'}</p>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Location</Label>
              <p className="text-gray-200">{user.location || '미정'}</p>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Website</Label>
              <p className="text-gray-200">
                {user.website_url ? (
                  <a href={user.website_url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">
                    {user.website_url}
                  </a>
                ) : (
                  '미정'
                )}
              </p>
            </div>
          </CardContent>
          <CardFooter className="p-6 border-t border-gray-700 flex justify-end">
            <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <Link href="/settings/profile">프로필 편집</Link>
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}