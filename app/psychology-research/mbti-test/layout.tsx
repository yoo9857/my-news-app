import { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'MBTI 성격 유형 검사 - 나의 유형은?',
  description: 'MBTI 검사를 통해 당신의 성격 유형을 알아보고, 자신과 타인을 이해하는 데 도움을 받으세요. 16가지 유형 중 당신은 어떤 유형에 속할까요?',
  keywords: ['MBTI', 'MBTI검사', '성격유형검사', '성격검사', '무료MBTI', '심리검사', '성격테스트'],
};

export default function MbtiTestLayout({ children }: { children: React.ReactNode }) {
  return (
    <>{children}</>
  );
}