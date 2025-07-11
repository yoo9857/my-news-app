'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const BackButton = () => {
  const router = useRouter();

  return (
    <Button variant="ghost" onClick={() => router.back()} className="text-slate-300 hover:bg-slate-800 hover:text-white">
      <ArrowLeft className="mr-2 h-4 w-4" />
      뒤로가기
    </Button>
  );
};

export default BackButton;
