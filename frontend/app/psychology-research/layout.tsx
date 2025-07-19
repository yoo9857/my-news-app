import { Metadata } from 'next';
import React from 'react';
import { Cinzel } from 'next/font/google';
import { cn } from '@/lib/utils';

// Apply the Cinzel font for a magical feel
const cinzel = Cinzel({ subsets: ['latin'], weight: ['400', '700'] });

export const metadata: Metadata = {
  title: '마법 심리 연구소 - TCI, MBTI 성격 유형 검사',
  description: '나도 몰랐던 나의 진짜 모습을 발견하는 곳. 과학적인 TCI 기질 및 성격 검사와 MBTI 성격 유형 검사를 통해 당신의 내면을 탐험하고 잠재력�� 확인해보세요.',
  keywords: ['심리검사', '성격검사', 'TCI', 'MBTI', '성격유형', '기질검사', '무료심리검사', '심리테스트'],
};

// A component for the starry, magical background
const MagicalBackground = () => (
  <div className="fixed inset-0 -z-20 h-full w-full bg-[#0a091e]">
    <div 
      className="absolute inset-0 -z-10 h-full w-full"
      style={{
        backgroundImage: 'radial-gradient(ellipse 80% 80% at 50% -20%, rgba(120, 119, 198, 0.3), rgba(255, 255, 255, 0))'
      }}
    />
    <div 
      className="fixed inset-0 -z-10"
      style={{
        backgroundImage: `url('/stars.svg')`, // Assuming you have a star pattern svg
        backgroundRepeat: 'repeat',
        opacity: 0.3,
      }}
    />
  </div>
);

// A simple SVG for the star pattern to be created
const StarsSVG = () => (
  <svg width="100" height="100" className="absolute -z-20">
    <defs>
      <pattern id="stars" patternUnits="userSpaceOnUse" width="100" height="100">
        <path d="M50 0 L52 48 L100 50 L52 52 L50 100 L48 52 L0 50 L48 48 Z" fill="rgba(255, 255, 255, 0.1)" />
        <circle cx="10" cy="20" r="1" fill="white" />
        <circle cx="80" cy="30" r="0.5" fill="white" />
        <circle cx="30" cy="70" r="1.2" fill="white" />
        <circle cx="90" cy="90" r="0.8" fill="white" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#stars)" />
  </svg>
);


export default function PsychologyResearchLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={cn("font-sans", cinzel.className)}>
      <MagicalBackground />
      {/* This SVG is for generating the pattern, but it's better to save it as a file */}
      {/* <StarsSVG /> */}
      <main>{children}</main>
    </div>
  );
}