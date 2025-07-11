"use client";

import React from 'react';
import { motion, Variants } from 'framer-motion';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowRight, BrainCircuit, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

// Background component that mimics an old, enchanted library
const EnchantedLibraryBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 h-full w-full bg-gradient-to-br from-[#2d1e1a] via-[#1a110e] to-[#0c0807]">
      <div 
        className="absolute inset-0 opacity-10" 
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23a0522d\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'%3E%3C/path%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        }}
      />
    </div>
  );
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 80, damping: 15 },
  },
};

export default function PsychologyResearchHomePage() {
  return (
    <div className="min-h-screen text-amber-100 p-4 sm:p-8 flex flex-col items-center justify-center relative overflow-hidden font-serif">
      <EnchantedLibraryBackground />
      
      <motion.div 
        className="text-center mb-12"
        initial="hidden"
        animate="visible"
        variants={itemVariants}
      >
        <Sparkles className="h-12 w-12 text-amber-400/80 mx-auto mb-4" />
        <h1 className="text-3xl sm:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 tracking-wider">
          마법 심리 연구소
        </h1>
        <p className="text-base sm:text-lg text-stone-400 max-w-xl">
          고대의 지혜를 통해 당신의 내면을 탐험하세요.
        </p>
      </motion.div>

      <motion.div 
        className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8"
        initial="hidden"
        animate="visible"
        variants={itemVariants}
      >
        {/* TCI Test Card */}
        <Link href="/psychology-research/tci-test" passHref legacyBehavior>
          <a className="block h-full">
            <Card className={cn(
              "group relative cursor-pointer overflow-hidden rounded-lg shadow-2xl shadow-black/50",
              "border border-amber-900/50 bg-gradient-to-br from-amber-50 to-amber-100",
              "transition-all duration-300 hover:border-amber-800/80 hover:shadow-amber-900/20 hover:scale-105"
            )}>
              <CardHeader className="relative text-center text-stone-800">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-amber-800/30 bg-amber-100/50">
                  <BrainCircuit className="h-8 w-8 text-amber-900/80" />
                </div>
                <CardTitle className="text-lg sm:text-xl font-bold text-stone-900">
                  TCI 기질 및 성격 검사
                </CardTitle>
                <CardDescription className="text-stone-600 mt-1">타고난 기질과 형성된 성격 분석</CardDescription>
              </CardHeader>
              <CardContent className="relative text-center">
                <p className="text-sm text-stone-700 px-4">
                  타고난 기질과 삶을 통해 형성된 성격을 분석하여, 당신의 고유한 잠재력과 가능성을 발견합니다.
                </p>
                <div className="mt-8 mb-2">
                  <div className="inline-flex items-center justify-center rounded-md bg-red-800 px-6 py-3 text-sm font-semibold text-amber-200 transition-all duration-300 group-hover:bg-red-700 group-hover:shadow-lg group-hover:shadow-red-900/50">
                    TCI 시작하기 <ArrowRight size={16} className="ml-2 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </a>
        </Link>

        {/* MBTI Test Card */}
        <Link href="/psychology-research/mbti-test" passHref legacyBehavior>
          <a className="block h-full">
            <Card className={cn(
              "group relative cursor-pointer overflow-hidden rounded-lg shadow-2xl shadow-black/50",
              "border border-teal-900/50 bg-gradient-to-br from-teal-50 to-teal-100",
              "transition-all duration-300 hover:border-teal-800/80 hover:shadow-teal-900/20 hover:scale-105"
            )}>
              <CardHeader className="relative text-center text-stone-800">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-teal-800/30 bg-teal-100/50">
                  <Sparkles className="h-8 w-8 text-teal-900/80" />
                </div>
                <CardTitle className="text-lg sm:text-xl font-bold text-stone-900">
                  MBTI 성격 유형 검사
                </CardTitle>
                <CardDescription className="text-stone-600 mt-1">에너지 방향과 인식, 판단 방식 분석</CardDescription>
              </CardHeader>
              <CardContent className="relative text-center">
                <p className="text-sm text-stone-700 px-4">
                  4가지 선호 지표를 통해 16가지 성격 유형 중 당신은 어디에 속하는지 알아보고, 행동 양식을 이해합니다.
                </p>
                <div className="mt-8 mb-2">
                  <div className="inline-flex items-center justify-center rounded-md bg-cyan-800 px-6 py-3 text-sm font-semibold text-teal-200 transition-all duration-300 group-hover:bg-cyan-700 group-hover:shadow-lg group-hover:shadow-cyan-900/50">
                    MBTI 시작하기 <ArrowRight size={16} className="ml-2 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </a>
        </Link>
      </motion.div>
    </div>
  );
}