'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ProfileForm from "@/components/profile-form";

export default function ProfileSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  if (status === "loading") {
    return <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">Loading profile...</div>;
  }

  if (!session) {
    router.push("/login");
    return null;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <Card className="w-full max-w-2xl bg-gray-800 border-gray-700 text-white">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-indigo-400">프로필 설정</CardTitle>
          <CardDescription className="text-gray-400">프로필 정보 및 비밀번호를 관리하세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm />
        </CardContent>
      </Card>
    </div>
  );
}