"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const cardVariants = {
  initial: { scale: 1, boxShadow: "0px 10px 20px rgba(0, 0, 0, 0.2)" },
  hover: { 
    scale: 1.05, 
    boxShadow: "0px 20px 40px rgba(0, 0, 0, 0.3)",
    transition: { duration: 0.3 }
  }
};

const flipVariants = {
  front: { rotateY: 0 },
  back: { rotateY: 180 }
};

export default function PsychologyResearchHomePage() {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleCardClick = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white p-8 flex flex-col items-center">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <h1 className="text-5xl font-bold mb-4 text-indigo-500">심리 연구소</h1>
        <p className="text-lg text-gray-300">당신의 내면을 탐험하고 새로운 가능성을 발견하세요.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
        {/* TCI Test Card */}
        <motion.div
          className="perspective-1000"
          style={{ width: '300px', height: '400px' }}
          onClick={handleCardClick}
          variants={cardVariants}
          initial="initial"
          whileHover="hover"
        >
          <motion.div
            className="relative w-full h-full transform-style-preserve-3d"
            animate={isFlipped ? "back" : "front"}
            variants={flipVariants}
            transition={{ duration: 0.7 }}
          >
            {/* Front of the card */}
            <div className="absolute w-full h-full backface-hidden">
              <Card className="bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] border border-[#333333] rounded-xl shadow-lg h-full flex flex-col justify-center items-center cursor-pointer">
                <CardHeader className="text-center">
                  <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }}>
                    <CardTitle className="text-3xl font-bold text-white">TCI</CardTitle>
                    <CardDescription className="text-gray-400 mt-2">기질 및 성격 검사</CardDescription>
                  </motion.div>
                </CardHeader>
              </Card>
            </div>
            {/* Back of the card */}
            <div className="absolute w-full h-full backface-hidden rotate-y-180">
              <Card className="bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] border border-[#444444] rounded-xl shadow-2xl h-full flex flex-col justify-center p-6">
                <CardContent className="text-center">
                  <p className="text-sm text-gray-300 mb-6">타고난 기질과 후천적 성격을 과학적으로 분석하여 당신의 고유한 특성과 성장 가능성을 탐색합니다.</p>
                  <Link href="/psychology-research/tci-test" passHref>
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-transform transform hover:scale-105">
                      테스트 시작하기
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </motion.div>

        {/* Placeholder Card */}
        <motion.div
          style={{ width: '300px', height: '400px' }}
          variants={cardVariants}
          initial="initial"
          whileHover="hover"
        >
          <Card className="bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] border border-[#333333] rounded-xl shadow-lg h-full flex flex-col justify-center items-center opacity-50">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-white">준비중</CardTitle>
              <CardDescription className="text-gray-400 mt-2">새로운 테스트가 곧 찾아옵니다.</CardDescription>
            </CardHeader>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

