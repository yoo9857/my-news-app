'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';

export default function PrivacySettingsPage() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();

  const [profileVisibility, setProfileVisibility] = useState('public');
  const [showEmail, setShowEmail] = useState('private');
  const [showActivityFeed, setShowActivityFeed] = useState(true);
  const [allowDirectMessages, setAllowDirectMessages] = useState(true);
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPrivacySettings();
    }
  }, [user]);

  const fetchPrivacySettings = async () => {
    if (!user) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_ADMIN_API_URL}/api/users/me/privacy`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProfileVisibility(data.profile_visibility);
        setShowEmail(data.show_email);
        setShowActivityFeed(data.show_activity_feed);
        setAllowDirectMessages(data.allow_direct_messages);
        setShowOnlineStatus(data.show_online_status);
      } else {
        const errorData = await response.json();
        toast({
          title: "개인 정보 설정 불러오기 실패",
          description: errorData.detail || "설정을 불러오는 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching privacy settings:", error);
      toast({
        title: "오류 발생",
        description: "네트워크 오류 또는 서버 문제.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_ADMIN_API_URL}/api/users/me/privacy`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          profile_visibility: profileVisibility,
          show_email: showEmail,
          show_activity_feed: showActivityFeed,
          allow_direct_messages: allowDirectMessages,
          show_online_status: showOnlineStatus,
        }),
      });

      if (response.ok) {
        toast({
          title: "개인 정보 설정 업데이트 성공",
          description: "설정이 성공적으로 저장되었습니다.",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "개인 정보 설정 업데이트 실패",
          description: errorData.detail || "설정 업데이트 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating privacy settings:", error);
      toast({
        title: "오류 발생",
        description: "네트워크 오류 또는 서버 문제.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <p>Loading privacy settings...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-gray-800 border-gray-700 text-white">
        <CardHeader>
          <CardTitle className="text-2xl text-indigo-400">개인 정보 설정</CardTitle>
          <CardDescription className="text-gray-400">프로필 공개 여부 및 활동 설정을 관리하세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="profileVisibility">프로필 공개 범위</Label>
              <Select value={profileVisibility} onValueChange={setProfileVisibility}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="공개 범위" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">공개</SelectItem>
                  <SelectItem value="followers_only">팔로워에게만 공개</SelectItem>
                  <SelectItem value="private">비공개</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="showEmail">이메일 공개 여부</Label>
              <Select value={showEmail} onValueChange={setShowEmail}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="이메일 공개" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">공개</SelectItem>
                  <SelectItem value="private">비공개</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="showActivityFeed">활동 피드 공개</Label>
              <Switch
                id="showActivityFeed"
                checked={showActivityFeed}
                onCheckedChange={setShowActivityFeed}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="allowDirectMessages">쪽지 허용</Label>
              <Switch
                id="allowDirectMessages"
                checked={allowDirectMessages}
                onCheckedChange={setAllowDirectMessages}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="showOnlineStatus">온라인 상태 표시</Label>
              <Switch
                id="showOnlineStatus"
                checked={showOnlineStatus}
                onCheckedChange={setShowOnlineStatus}
              />
            </div>

            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={isSaving}>
              {isSaving ? '저장 중...' : '변경 사항 저장'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}