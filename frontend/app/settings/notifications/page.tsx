'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react'; // Changed from useAuth
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';

export default function NotificationSettingsPage() {
  const { data: session, status } = useSession(); // Changed from useAuth
  const { toast } = useToast();

  const [onNewComment, setOnNewComment] = useState(true);
  const [onNewFollower, setOnNewFollower] = useState(true);
  const [onPostLike, setOnPostLike] = useState(true);
  const [onMention, setOnMention] = useState(true);
  const [onDirectMessage, setOnDirectMessage] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && session?.accessToken) {
      fetchNotificationSettings();
    }
  }, [session, status]);

  const fetchNotificationSettings = async () => {
    if (!session?.accessToken) return; // Ensure token exists
    try {
      const response = await fetch(`http://localhost:8002/users/me/notifications`, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOnNewComment(data.on_new_comment);
        setOnNewFollower(data.on_new_follower);
        setOnPostLike(data.on_post_like);
        setOnMention(data.on_mention);
        setOnDirectMessage(data.on_direct_message);
        setEmailNotifications(data.email_notifications);
        setPushNotifications(data.push_notifications);
      } else {
        const errorData = await response.json();
        toast({
          title: "알림 설정 불러오기 실패",
          description: errorData.detail || "설정을 불러오는 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching notification settings:", error);
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

    if (!session?.accessToken) {
      setError("인증 토큰이 없습니다.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`http://localhost:8002/users/me/notifications`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({
          on_new_comment: onNewComment,
          on_new_follower: onNewFollower,
          on_post_like: onPostLike,
          on_mention: onMention,
          on_direct_message: onDirectMessage,
          email_notifications: emailNotifications,
          push_notifications: pushNotifications,
        }),
      });

      if (response.ok) {
        toast({
          title: "알림 설정 업데이트 성공",
          description: "설정이 성공적으로 저장되었습니다.",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "알림 설정 업데이트 실패",
          description: errorData.detail || "설정 업데이트 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating notification settings:", error);
      toast({
        title: "오류 발생",
        description: "네트워크 오류 또는 서버 문제.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <p>Loading notification settings...</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <p>Please log in to view notification settings.</p>
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
          <CardTitle className="text-2xl text-indigo-400">알림 설정</CardTitle>
          <CardDescription className="text-gray-400">어떤 알림을 받을지 관리하세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center justify-between">
              <Label htmlFor="onNewComment">새 댓글</Label>
              <Switch
                id="onNewComment"
                checked={onNewComment}
                onCheckedChange={setOnNewComment}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="onNewFollower">새 팔로워</Label>
              <Switch
                id="onNewFollower"
                checked={onNewFollower}
                onCheckedChange={setOnNewFollower}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="onPostLike">게시물 좋아요</Label>
              <Switch
                id="onPostLike"
                checked={onPostLike}
                onCheckedChange={setOnPostLike}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="onMention">멘션</Label>
              <Switch
                id="onMention"
                checked={onMention}
                onCheckedChange={setOnMention}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="onDirectMessage">쪽지</Label>
              <Switch
                id="onDirectMessage"
                checked={onDirectMessage}
                onCheckedChange={setOnDirectMessage}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="emailNotifications">이메일 알림</Label>
              <Switch
                id="emailNotifications"
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="pushNotifications">푸시 알림</Label>
              <Switch
                id="pushNotifications"
                checked={pushNotifications}
                onCheckedChange={setPushNotifications}
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