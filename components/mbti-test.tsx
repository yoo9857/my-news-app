'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// --- MBTI Questions and Options ---
const mbtiQuestions = [
  {
    id: 'ei',
    category: '에너지의 방향 (E/I)',
    question: '당신은 주로 에너지를 어디에서 얻는 편인가요?',
    options: [
      { value: 'E', text: '활동적이고 사교적인 외부 세계 (외향형)' },
      { value: 'I', text: '조용하고 내성적인 내면 세계 (내향형)' },
    ],
  },
  {
    id: 'sn',
    category: '정보 인식 (S/N)',
    question: '당신은 주로 정보를 어떻게 인식하는 편인가요?',
    options: [
      { value: 'S', text: '오감에 의존하여 실제적이고 구체적인 정보 (감각형)' },
      { value: 'N', text: '직관에 의존하여 가능성과 의미를 탐색하는 정보 (직관형)' },
    ],
  },
  {
    id: 'tf',
    category: '판단 및 결정 (T/F)',
    question: '당신은 주로 어떻게 판단하고 결정하는 편인가요?',
    options: [
      { value: 'T', text: '논리와 분석을 통해 객관적이고 합리적인 판단 (사고형)' },
      { value: 'F', text: '사람과의 관계와 가치를 고려하여 주관적이고 조화로운 판단 (감정형)' },
    ],
  },
  {
    id: 'jp',
    category: '생활 양식 (J/P)',
    question: '당신은 주로 어떤 생활 양식을 선호하는 편인가요?',
    options: [
      { value: 'J', text: '계획적이고 체계적으로 정리된 생활 (판단형)' },
      { value: 'P', text: '자율적이고 융통성 있게 상황에 맞춰가는 생활 (인식형)' },
    ],
  },
];

// --- Animation Variants ---
const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

// --- UI Components ---
const AuroraBackground = () => (
  <div className="fixed inset-0 -z-10 overflow-hidden">
    <div className="absolute w-[800px] h-[600px] rounded-full bg-indigo-900/40 blur-[150px] opacity-40 left-[-20%] top-[-20%]" />
    <div className="absolute w-[700px] h-[500px] rounded-full bg-purple-900/40 blur-[150px] opacity-40 right-[-20%] bottom-[-20%]" />
  </div>
);

interface RadioOptionProps {
  questionId: string;
  value: string;
  text: string;
  checked: boolean;
  onChange: (questionId: string, value: string) => void;
}

const RadioOption: React.FC<RadioOptionProps> = ({ questionId, value, text, checked, onChange }) => (
  <label className="relative flex flex-col items-center justify-center cursor-pointer w-full">
    <input
      type="radio"
      name={questionId}
      value={value}
      onChange={() => onChange(questionId, value)}
      checked={checked}
      className="sr-only"
      required
    />
    <motion.div
      className={cn(
        "w-full p-4 rounded-lg flex items-center justify-center border-2 transition-colors text-center",
        checked ? "bg-indigo-500 border-indigo-400 text-white" : "bg-slate-700/50 border-slate-600 text-slate-400 hover:border-indigo-500"
      )}
      whileTap={{ scale: 0.95 }}
    >
      {text}
    </motion.div>
  </label>
);

export default function MbtiTest() {
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [showResults, setShowResults] = useState(false);
  const [mbtiType, setMbtiType] = useState<string | null>(null);
  const { toast } = useToast();

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const calculateMbtiType = useMemo(() => {
    if (Object.keys(answers).length !== mbtiQuestions.length) {
      return null;
    }
    const type = mbtiQuestions.map(q => answers[q.id]).join('');
    return type;
  }, [answers]);

  const handleSubmit = () => {
    if (Object.keys(answers).length < mbtiQuestions.length) {
      toast({ title: "잠시만요!", description: "모든 질문에 답변을 완료해주세요.", variant: "destructive" });
      return;
    }
    const calculatedType = calculateMbtiType;
    if (calculatedType) {
      setMbtiType(calculatedType);
      setShowResults(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const renderQuestionForm = () => (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <Card className="bg-slate-900/70 backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-slate-200">MBTI 성격 유형 검사</CardTitle>
          <CardDescription className="text-slate-400">각 문항을 읽고 자신에게 더 가까운 쪽을 선택해주세요.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {mbtiQuestions.map((q, index) => (
            <motion.div key={q.id} variants={itemVariants} className="mb-6 last:mb-0 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <h4 className="font-semibold text-indigo-400 mb-4 text-lg">{q.category}</h4>
              <p className="font-medium text-slate-300 mb-4 text-base">{q.question}</p>
              <div className="flex flex-col sm:flex-row gap-4">
                {q.options.map(option => (
                  <RadioOption
                    key={option.value}
                    questionId={q.id}
                    value={option.value}
                    text={option.text}
                    checked={answers[q.id] === option.value}
                    onChange={handleAnswerChange}
                  />
                ))}
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>
      <div className="text-center mt-8">
        <Button onClick={handleSubmit} size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-full shadow-lg shadow-indigo-500/20 transition-all transform hover:scale-105">
          결과 확인하기
        </Button>
      </div>
    </motion.div>
  );

  const renderResults = () => {
    // Placeholder for MBTI result interpretation
    return (
      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        <Card className="bg-slate-900/70 backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-slate-200">당신의 MBTI 유형은?</CardTitle>
            <CardDescription className="text-slate-400 mt-2">결과는 참고용으로만 활용해주세요.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center text-slate-300 text-xl font-semibold mb-4">
              {mbtiType ? `${mbtiType} 입니다!` : '결과를 계산할 수 없습니다.'}
            </div>
            <div className="text-center text-slate-300">
              MBTI 결과 해석은 현재 개발 중입니다.
              <br />
              곧 멋진 모습으로 찾아뵙겠습니다!
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0A0F1A] text-white">
      <AuroraBackground />
      <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-4xl relative z-10">
        <header className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-200 mb-2">MBTI 성격 유형 검사</h1>
          <p className="text-md text-slate-400">나의 성격 유형을 탐색하는 시간</p>
        </header>
        <AnimatePresence mode="wait">
          {showResults ? (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {renderResults()}
            </motion.div>
          ) : (
            <motion.div key="questions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {renderQuestionForm()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
