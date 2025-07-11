import { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: '마법 심리 연구소 - TCI, MBTI 성격 유형 검사',
  description: '나도 몰랐던 나의 진짜 모습을 발견하는 곳. 과학적인 TCI 기질 및 성격 검사와 MBTI 성격 유형 검사를 통해 당신의 내면을 탐험하고 잠재력을 확인해보세요.',
  keywords: ['심리검사', '성격검사', 'TCI', 'MBTI', '성격유형', '기질검사', '무료심리검사', '심리테스트'],
};

export default function PsychologyResearchLayout({ children }: { children: React.ReactNode }) {
  return (
    <>{children}</>
  );
}