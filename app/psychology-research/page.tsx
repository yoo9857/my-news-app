"use client";

import React from 'react';
import { motion, Variants } from 'framer-motion';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowRight, BrainCircuit, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

// New component for the starlight background
const StarlightBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 h-full w-full bg-gradient-to-b from-[#0c0a1d] to-[#1d1a3d]">
      {/* You can add more complex star animations here if needed */}
      <div className="absolute inset-0 opacity-30">
        {/* Static stars for performance */}
        <div className="absolute top-[20%] left-[10%] h-1 w-1 rounded-full bg-white/80 shadow-[0_0_10px_2px_#fff]"></div>
        <div className="absolute top-[50%] left-[80%] h-1 w-1 rounded-full bg-white/80 shadow-[0_0_8px_1px_#fff]"></div>
        <div className="absolute top-[80%] left-[30%] h-1 w-1 rounded-full bg-white/70 shadow-[0_0_12px_2px_#fff]"></div>
        <div className="absolute top-[10%] left-[90%] h-0.5 w-0.5 rounded-full bg-white/60 shadow-[0_0_6px_1px_#fff]"></div>
        <div className="absolute top-[60%] left-[5%] h-0.5 w-0.5 rounded-full bg-white/60 shadow-[0_0_6px_1px_#fff]"></div>
      </div>
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
    <div className="min-h-screen text-slate-200 p-4 sm:p-8 flex flex-col items-center justify-center relative overflow-hidden">
      <StarlightBackground />
      
      <motion.div 
        className="text-center mb-12"
        initial="hidden"
        animate="visible"
        variants={itemVariants}
      >
        <Sparkles className="h-12 w-12 text-yellow-300/80 mx-auto mb-4" />
        <h1 className="text-3xl sm:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-br from-yellow-200 via-yellow-300 to-yellow-500 tracking-wide">
          별빛 서재
        </h1>
        <p className="text-base sm:text-lg text-slate-400 max-w-xl">
          내면의 우주를 탐험하고, 당신의 별자리를 찾아보세요.
        </p>
      </motion.div>

      <motion.div 
        initial="hidden"
        animate="visible"
        variants={itemVariants}
        whileHover={{ y: -8, scale: 1.03 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="w-full max-w-md"
      >
        <Link href="/psychology-research/tci-test" passHref legacyBehavior>
          <a className="block h-full">
            <Card className={cn(
              "group relative cursor-pointer overflow-hidden rounded-2xl shadow-2xl shadow-black/50",
              "border border-yellow-300/20 bg-slate-900/60 backdrop-blur-md",
              "transition-all duration-300 hover:border-yellow-300/50 hover:shadow-yellow-300/10"
            )}>
              <div className="absolute top-0 left-0 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                   style={{
                     background: "radial-gradient(circle at 50% 50%, rgba(253, 224, 71, 0.1), transparent 70%)"
                   }} />
              <CardHeader className="relative text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-yellow-300/30 bg-slate-800/80">
                  <BrainCircuit className="h-8 w-8 text-yellow-300/90" />
                </div>
                <CardTitle className="text-lg sm:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-400">
                  TCI 기질 및 성격 검사
                </CardTitle>
                <CardDescription className="text-slate-400 mt-1">고대의 지혜와 현대 과학의 만남</CardDescription>
              </CardHeader>
              <CardContent className="relative text-center">
                <p className="text-sm text-slate-300 px-4">
                  타고난 기질과 삶을 통해 형성된 성격을 분석하여, 당신의 고유한 잠재력과 가능성을 발견합니다.
                </p>
                <div className="mt-8 mb-2">
                  <div className="inline-flex items-center justify-center rounded-full bg-yellow-400/10 px-6 py-3 text-sm font-semibold text-yellow-300 transition-colors group-hover:bg-yellow-400/20">
                    여정 시작하기 <ArrowRight size={16} className="ml-2 transition-transform group-hover:translate-x-1" />
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