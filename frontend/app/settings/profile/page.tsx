'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ColorPicker } from '@/components/ui/color-picker'; // Assuming you have a color picker component
import { motion } from 'framer-motion';

export default function ProfileSettingsPage() {
  const { user, isLoading, login } = useAuth();
  const { toast } = useToast();

  const [nickname, setNickname] = useState(user?.nickname || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [profileImageUrl, setProfileImageUrl] = useState(user?.avatar_url || '');
  const [websiteUrl, setWebsiteUrl] = useState(user?.website_url || '');
  const [location, setLocation] = useState(user?.location || '');
  const [themeColor, setThemeColor] = useState(user?.theme_color || '#007bff');
  const [backgroundImageUrl, setBackgroundImageUrl] = useState(user?.background_image_url || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setNickname(user.nickname || '');
      setBio(user.bio || '');
      setProfileImageUrl(user.avatar_url || '');
      setWebsiteUrl(user.website_url || '');
      setLocation(user.location || '');
      setThemeColor(user.theme_color || '#007bff');
      setBackgroundImageUrl(user.background_image_url || '');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_ADMIN_API_URL}/api/users/me/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          nickname: nickname || null,
          bio: bio || null,
          profile_image_url: profileImageUrl || null,
          website_url: websiteUrl || null,
          location: location || null,
          theme_color: themeColor || null,
          background_image_url: backgroundImageUrl || null,
        }),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        // Manually update the user in AuthContext to reflect changes immediately
        // This is a simplified approach. A full re-fetch might be better for complex scenarios.
        await login(localStorage.getItem('access_token') || ''); // Re-fetch user to update context
        toast({
          title: "프로필 업데이트 성공",
          description: "프로필 정보가 성공적으로 저장되었습니다.",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "프로필 업데이트 실패",
          description: errorData.detail || "프로필 업데이트 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
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
        <p>Loading profile settings...</p>
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
          <CardTitle className="text-2xl text-indigo-400">프로필 설정</CardTitle>
          <CardDescription className="text-gray-400">개인 프로필 정보를 업데이트하세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="nickname">닉네임</Label>
              <Input id="nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="bio">자기소개</Label>
              <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={4} />
            </div>
            <div>
              <Label htmlFor="profileImageUrl">프로필 이미지 URL</Label>
              <Input id="profileImageUrl" value={profileImageUrl} onChange={(e) => setProfileImageUrl(e.target.value)} />
              {profileImageUrl && <img src={profileImageUrl} alt="Profile Preview" className="mt-2 w-24 h-24 rounded-full object-cover" />}
            </div>
            <div>
              <Label htmlFor="websiteUrl">웹사이트 URL</Label>
              <Input id="websiteUrl" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="location">위치</Label>
              <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="themeColor">테마 색상</Label>
              {/* Assuming ColorPicker is a component that takes value and onChange */}
              {/* <ColorPicker value={themeColor} onChange={setThemeColor} /> */}
              <Input id="themeColor" type="color" value={themeColor} onChange={(e) => setThemeColor(e.target.value)} className="w-full h-10" />
            </div>
            <div>
              <Label htmlFor="backgroundImageUrl">배경 이미지 URL</Label>
              <Input id="backgroundImageUrl" value={backgroundImageUrl} onChange={(e) => setBackgroundImageUrl(e.target.value)} />
              {backgroundImageUrl && <img src={backgroundImageUrl} alt="Background Preview" className="mt-2 w-full h-32 object-cover rounded-md" />}
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