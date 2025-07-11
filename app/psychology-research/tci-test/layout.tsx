import { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'TCI 기질 및 성격 검사 - 나를 찾아 떠나는 여행',
  description: '과학적인 TCI 검사를 통해 당신의 타고난 기질과 후천적으로 형성된 성격을 깊이 있게 분석해보세요. 나의 진짜 모습을 이해하고 잠재력을 발견할 수 있습니다.',
  keywords: ['TCI', 'TCI검사', '기질및성격검사', '성격검사', '기질검사', '성격유형', '심리검사', '무료심리검사'],
};

export default function TciTestLayout({ children }: { children: React.ReactNode }) {
  return (
    <>{children}</>
  );
}