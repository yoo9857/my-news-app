"use client";

import React from 'react';
import { motion, Variants } from 'framer-motion';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowRight, BrainCircuit, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 50, filter: 'blur(10px)' },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      type: "spring",
      stiffness: 50,
      damping: 20,
      delay: i * 0.2,
    },
  }),
};

export default function PsychologyResearchHomePage() {
  return (
    <div className="min-h-screen text-gray-200 p-4 sm:p-8 flex flex-col items-center justify-center relative overflow-hidden">
      <motion.div 
        className="text-center mb-16"
        initial="hidden"
        animate="visible"
        custom={0}
        variants={itemVariants}
      >
        <Sparkles className="h-16 w-16 text-yellow-300/80 mx-auto mb-4 animate-pulse" />
        <h1 className="text-4xl sm:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-br from-yellow-200 via-yellow-400 to-amber-500 tracking-wider" style={{ textShadow: '0 0 15px rgba(252, 211, 77, 0.3)' }}>
          마법 심리 연구소
        </h1>
        <p className="text-base sm:text-lg text-indigo-200/70 max-w-xl tracking-wider">
          고대의 지혜와 별빛의 인도를 통해 당신의 내면을 탐험하세요.
        </p>
      </motion.div>

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* TCI Test Card */}
        <motion.div initial="hidden" animate="visible" custom={1} variants={itemVariants}>
          <Link href="tci-test" passHref legacyBehavior>
            <a className="block h-full">
              <Card className={cn(
                "group relative cursor-pointer overflow-hidden rounded-xl shadow-2xl shadow-black/60 h-full",
                "border border-yellow-700/30 bg-gradient-to-br from-indigo-900/20 via-transparent to-transparent backdrop-blur-sm",
                "transition-all duration-500 hover:border-yellow-500/50 hover:shadow-yellow-500/10 hover:scale-105"
              )}>
                <CardHeader className="relative text-center text-gray-200 z-10">
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border-2 border-yellow-400/30 bg-black/20 transition-all duration-300 group-hover:border-yellow-400/80 group-hover:bg-yellow-900/30">
                    <BrainCircuit className="h-10 w-10 text-yellow-300/80 transition-transform duration-300 group-hover:scale-110" />
                  </div>
                  <CardTitle className="text-xl sm:text-2xl font-bold text-yellow-200 tracking-widest">
                    기질과 성격의 연금술
                  </CardTitle>
                  <CardDescription className="text-indigo-200/80 mt-2 tracking-wider">TCI 검사</CardDescription>
                </CardHeader>
                <CardContent className="relative text-center z-10">
                  <p className="text-sm text-indigo-200/90 px-4">
                    타고난 기질과 삶을 통해 형성된 성격을 분석하여, 당신의 고유한 잠재력과 가능성을 발견합니다.
                  </p>
                  <div className="mt-8 mb-2">
                    <div className="inline-flex items-center justify-center rounded-full bg-yellow-600/80 px-8 py-3 text-sm font-bold text-gray-900 transition-all duration-300 group-hover:bg-yellow-500 group-hover:shadow-lg group-hover:shadow-yellow-500/30">
                      연금술 시작하기 <ArrowRight size={16} className="ml-2 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </a>
          </Link>
        </motion.div>

        {/* MBTI Test Card */}
        <motion.div initial="hidden" animate="visible" custom={2} variants={itemVariants}>
          <Link href="mbti-test" passHref legacyBehavior>
            <a className="block h-full">
              <Card className={cn(
                "group relative cursor-pointer overflow-hidden rounded-xl shadow-2xl shadow-black/60 h-full",
                "border border-purple-700/30 bg-gradient-to-br from-purple-900/20 via-transparent to-transparent backdrop-blur-sm",
                "transition-all duration-500 hover:border-purple-500/50 hover:shadow-purple-500/10 hover:scale-105"
              )}>
                <CardHeader className="relative text-center text-gray-200 z-10">
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border-2 border-purple-400/30 bg-black/20 transition-all duration-300 group-hover:border-purple-400/80 group-hover:bg-purple-900/30">
                    <Sparkles className="h-10 w-10 text-purple-300/80 transition-transform duration-300 group-hover:scale-110" />
                  </div>
                  <CardTitle className="text-xl sm:text-2xl font-bold text-purple-200 tracking-widest">
                    네 가지 원소 성격 유형
                  </CardTitle>
                  <CardDescription className="text-indigo-200/80 mt-2 tracking-wider">MBTI 검사</CardDescription>
                </CardHeader>
                <CardContent className="relative text-center z-10">
                  <p className="text-sm text-indigo-200/90 px-4">
                    4가지 선호 지표를 통해 16가지 성격 유형 중 당신은 어디에 속하는지 알아보고, 행동 양식을 이해합니다.
                  </p>
                  <div className="mt-8 mb-2">
                    <div className="inline-flex items-center justify-center rounded-full bg-purple-600/80 px-8 py-3 text-sm font-bold text-gray-900 transition-all duration-300 group-hover:bg-purple-500 group-hover:shadow-lg group-hover:shadow-purple-500/30">
                      원소 찾기 <ArrowRight size={16} className="ml-2 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </a>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
