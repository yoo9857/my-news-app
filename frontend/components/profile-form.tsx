'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ProfileForm() {
  const { data: session, update } = useSession();
  const { toast } = useToast();
  const [nickname, setNickname] = useState(session?.user?.nickname || '');
  const [avatarUrl, setAvatarUrl] = useState(session?.user?.avatar_url || '');
  const [email, setEmail] = useState(session?.user?.email || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) {
      setNickname(session.user.nickname || session.user.name || '');
      setAvatarUrl(session.user.avatar_url || session.user.image || '');
      setEmail(session.user.email || '');
      setPreviewUrl(session.user.avatar_url || session.user.image || null);
    }
  }, [session]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setSelectedFile(null);
      setPreviewUrl(avatarUrl); // Revert to current avatar if no new file selected
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!session?.accessToken) {
      setError("인증 토큰이 없습니다. 다시 로그인해주세요.");
      setLoading(false);
      return;
    }
    console.log("Access Token:", session.accessToken); // ADDED FOR DEBUG
    let finalAvatarUrl = avatarUrl; // Start with current avatar URL

    try {
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);

        const uploadRes = await fetch(`http://localhost:8002/upload/avatar`, {
          method: 'POST',
          body: formData,
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          finalAvatarUrl = `http://localhost:8002${uploadData.url}`;
          console.log("DEBUG: Uploaded avatar URL from backend:", uploadData.url); // ADDED FOR DEBUG
          console.log("DEBUG: Final avatar URL for PUT request:", finalAvatarUrl); // ADDED FOR DEBUG
        } else {
          const uploadErrorData = await uploadRes.json();
          setError(uploadErrorData.detail || '이미지 업로드 실패.');
          toast({
            title: "이미지 업로드 실패",
            description: uploadErrorData.detail || '이미지 업로드 중 오류가 발생했습니다.',
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      }

      const res = await fetch(`http://localhost:8002/users/me/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({ nickname, avatar_url: finalAvatarUrl }),
      });

      if (res.ok) {
        const updatedUser = await res.json();
        // Update the session with the new user data
        await update({ user: { ...session?.user, nickname: updatedUser.nickname, avatar_url: updatedUser.avatar_url } });
        setAvatarUrl(updatedUser.avatar_url);
        setPreviewUrl(null); // Clear previewUrl to force re-render with new session avatar
        setSelectedFile(null); // Clear selected file
        console.log("DEBUG: Session updated with new avatar_url:", updatedUser.avatar_url); // ADDED FOR DEBUG
        toast({
          title: "프로필 업데이트 성공!",
          description: "프로필 정보가 성공적으로 업데이트되었습니다.",
        });
      } else {
        const errorData = await res.json();
        setError(errorData.detail || '프로필 업데이트 실패.');
        toast({
          title: "프로필 업데이트 실패",
          description: errorData.detail || '다시 시도해주세요.',
          variant: "destructive",
        });
      }
    } catch (err) {
      setError('예상치 못한 오류가 발생했습니다.');
      toast({
        title: "오류 발생",
        description: "예상치 못한 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={email} disabled className="mt-1 bg-gray-700 border-gray-600 text-gray-400" />
      </div>
      <div>
        <Label htmlFor="nickname">Nickname</Label>
        <Input
          id="nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className="mt-1 bg-gray-700 border-gray-600 text-white focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>
      <div>
        <Label htmlFor="avatar">Profile Picture</Label>
        <div className="flex items-center space-x-4 mt-1">
          <Avatar className="h-20 w-20">
            
            <AvatarImage key={previewUrl || session?.user?.avatar_url || 'default'} src={previewUrl || session?.user?.avatar_url || undefined} alt="Profile Picture" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <Input
            id="avatar"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="flex-grow bg-gray-700 border-gray-600 text-white focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
      </div>
      <Button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
        {loading ? 'Updating...' : 'Update Profile'}
      </Button>
    </form>
  );
}