'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Sparkles, BrainCircuit, ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';

// --- Data & Interpretation ---
const questions = {
    '자극 추구 (Novelty Seeking)': {
        subfactors: {
            '탐색적 흥분': ["새롭고 신기한 것을 보면 일단 해보고 싶다.", "모험이나 스릴을 즐기는 편이다.", "예측 불가능한 상황에서 오히려 흥미를 느낀다."],
            '충동성': ["때로는 결과를 생각하기 전에 행동부터 할 때가 있다.", "쉽게 지루함을 느끼고, 즉흥적으로 행동하는 것을 좋아한다.", "기분 전환을 위해 돈을 쓰거나 새로운 것을 사는 경우가 잦다.", "하나의 일에 오래 집��하는 것이 어렵게 느껴진다."],
            '무���제': ["규칙이나 절차에 얽매이는 것을 답답해한다.", "감정 표현이 풍부하고, 하고 싶은 말은 하는 편이다.", "전통적인 방식보다는 나만의 새로운 방식을 시도하는 것을 선호한다."]
        }
    },
    '위험 회피 (Harm Avoidance)': {
        subfactors: {
            '예기 불안': ["처음 해보는 일이나 불확실한 상황이 걱정되고 불안하다.", "사소한 일에도 걱정을 많이 하는 편이다.", "최악의 상황을 먼저 상상하며 대비하려는 경향이 있다."],
            '불확실성에 대한 두려움': ["어떤 일을 시작하기 전에 미리 꼼꼼하게 계획하고 준비한다.", "예상치 못한 변화가 생기면 당황스럽다.", "결정이 내려진 일이 바뀌는 것을 매우 싫어한다.", "명확한 가이드라인이나 지침이 있는 일을 선호한다."],
            '수줍음': ["낯선 사람을 만나면 쉽게 긴장하고 수줍음을 탄다.", "사람들 앞에서 발표하거나 주목받는 것을 피하고 싶다.", "새로운 모임이나 집단에 들어가는 것이 어색하고 힘들다."]
        }
    },
    '사회적 민감성 (Reward Dependence)': {
        subfactors: {
            '정서적 감수성': ["다른 사람의 칭찬이나 인정에 기분이 많이 좌우된����.", "정이 많고 눈물이 많다는 말을 자주 듣는다.", "다른 사람의 미묘한 감정 변화를 잘 알아차린다.", "드라마나 영화를 보며 주인공의 감정에 깊이 몰입한다.", "다른 사람의 비판이나 거절에 쉽게 상처받는다."],
            '사회적 애착': ["다른 사람의 감정에 깊이 공감하고, 남을 돕는 것을 좋아한다.", "한번 인연을 맺은 사람들과 오래 관계를 유지하고 싶다.", "혼자 있는 것보다 다른 사람들과 함께 있을 때 더 힘이 난다.", "주변 사람들의 기념일이나 중요한 일을 잘 챙긴다.", "사람들과의 관계가 틀어지면 큰 스트레스를 받는다."]
        }
    },
    '인내력 (Persistence)': {
        subfactors: {
            '끈기': ["일이 힘들고 지치더라도 한번 시작하면 끝까지 해내려고 한다.", "목표를 달성하기 위해 당장의 즐거움을 미룰 수 있다.", "단기적인 성과가 보이지 않아도 꾸준히 노력할 수 있다.", "어려운 문제를 만나면 해결될 때까지 붙들고 있는다.", "반복적인 작업도 목표를 위해서라면 잘 참아낼 수 있다."],
            '완벽주의': ["내가 한 일에 대해 높은 기준을 가지고 있다.", "사소한 실수도 그냥 넘어가지 못하고 수정해야 ����성이 풀린다.", "다른 사람들도 나만큼 열심히 해주기를 기대한다.", "과정보다 결과의 완벽함이 더 중요하다고 생각한다.", "어떤 일이든 최고가 되고 싶다는 욕심이 있다."]
        }
    },
    '자율성 (Self-Directedness)': {
        subfactors: {
            '책임감': ["나는 내 삶의 주인이 나 자신이라고 확신한다.", "자신의 선택과 행동에 대해 스스로 책임지려 한다.", "어떤 결과가 나오든 남의 탓으로 돌리지 않는다."],
            '목표의식': ["나에게는 명확한 인생의 목표나 방향이 있다.", "어려움이 닥쳐도 스스로 해결할 방법을 찾을 수 있다.", "목표를 이루기 위해 구체적인 계획을 세우고 실천한다.", "나는 내가 원하는 것이 무엇인지 분명히 알고 있다."],
            '자기수용': ["나는 나의 장점과 단점을 포함해 나 자신을 있는 그대로 받아들인다.", "자신에 대한 자부심을 느끼며 만족스럽다.", "실패하더라도 나 자신을 질책하기보다 격려하는 편이다."]
        }
    },
    '연대감 (Cooperativeness)': {
        subfactors: {
            '타인수용': ["나는 다�� 사람들을 조건 없이 이해하고 수용하려고 노력한다.", "나와 다른 가치관을 가�� 사람도 존중할 수 있다.", "사람들의 단점보다는 장점을 먼저 보려고 한다."],
            '공감능력': ["다른 사람의 입장에서 생각하는 것이 어렵지 않다.", "타인의 슬픔이나 기쁨을 내 일처럼 느낄 때가 많다.", "다른 사람이 말을 할 때, 그 사람의 감정을 느끼며 듣는다.", "다른 사람의 어려움을 보면 그냥 지나치지 못한다."],
            '이타주의': ["공동체의 이익을 위해 기꺼이 내 것을 양보할 수 있다.", "사람들은 기본적으로 선하고 신뢰할 만하다고 생각한다.", "다른 사람을 돕는 것에서 보람과 행복을 느낀다."]
        }
    },
    '자기초월 (Self-Transcendence)': {
        subfactors: {
            '창조적 자기망각': ["자연의 아름다움이나 예술 작품을 보며 깊은 감동을 느낄 때가 많다.", "상상에 깊이 빠져들거나 몽상을 즐기는 편이다.", "어떤 일에 몰두하면 시간 가는 줄 모를 때가 자주 있다.", "아름다운 것을 보면 그 순간을 온전히 느끼고 싶어 한다.", "직관이나 영감을 중요하게 생각한다."],
            '우주만물과의 일체감': ["때때로 세상 만물�� 내가 하나로 연결된 듯한 느낌을 받는다.", "물질적인 성공보다 영적인 가치�� 깨달음이 더 중요하다고 생각한다.", "세상의 모든 생명은 소중하며 서로 연결되어 있다고 믿는다.", "욕심을 내려놓을 때 마음의 평화를 얻는다.", "나 자신을 넘어서는 더 큰 존재나 원리를 느낄 때가 있다."]
        }
    }
};
const interpretations = {
    '자극 추구': { low: '새로움보다는 익숙함을 선호하며, 신중하고 예측 가능한 환경에서 편안함을 느낍니다.', high: '새로운 경험과 모험을 즐기며, 변화와 자극을 끊임없이 추구하는 탐험가 기질을 가졌습니다.' },
    '위험 회피': { low: '낙관적이고 대담하며, 불확실한 상황에서도 걱정보다는 자신감을 가집니다.', high: '신중하고 조심성이 많으며, 위험을 미리 감지하고 대비하는 능력이 뛰어납니다.' },
    '사회적 민감성': { low: '타인의 평가에 크게 연연하지 않으며, 독립적으로 관계를 맺고 판단하는 경향이 있습니다.', high: '타인의 감정에 깊이 공감하고, 따뜻한 관계와 사회적 인정을 중요하게 생각하는 이타적인 마음을 가졌습니다.' },
    '인내력': { low: '다양한 관심사를 가지고 있으며, 한 가지 일에 얽매이기보다 여러 가능성을 탐색하는 것을 즐깁니다.', high: '한번 목표를 정하�� 어떤 ��려움에도 굴하지 않고, 꾸준히 노력하여 결국 성취해내는 강한 의지를 지녔습니다.' },
    '자율성': { low: '상황이나 타인의 의견에 유연하게 적응하며, 자신을 환경에 맞춰 변화시키는 능력이 있습니다.', high: '자신의 삶에 대한 뚜렷한 목표와 책임감을 가지고, 스스로의 가치와 신념에 따라 행동하는 주체적인 사람입니다.' },
    '연대감': { low: '개인의 원칙과 개성을 중요시하며, 타인과 적절한 거리를 유지하는 것을 편안하게 느낍니다.', high: '타인을 이해하고 수용하는 마음이 넓으며, 공동체의 조화와 발전을 위해 기꺼이 협력하는 사회적인 사람입니다.' },
    '자기초월': { low: '현실적이고 실용적인 것에 집중하며, 명확하고 구체적인 세계를 선호합니다.', high: '물질적인 것을 넘어, 우주와 예술, 영적인 가치에 깊이 몰입하며 세상과 하나됨을 느끼는 초월적인 사람입니다.' },
};
const getTotalQuestions = () => Object.values(questions).flatMap(g => Object.values(g.subfactors)).flat().length;

// --- Animation Variants ---
const containerVariants: Variants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const itemVariants: Variants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } } };

// --- UI Components ---
const RuneRadio = ({ questionId, value, checked, onChange }: any) => (
  <label className="relative flex flex-col items-center justify-center cursor-pointer group">
    <input type="radio" name={questionId} value={value} onChange={() => onChange(questionId, value)} checked={checked} className="sr-only" required />
    <motion.div
      className={cn("w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 font-bold text-base",
        checked ? "bg-yellow-400/80 border-yellow-300 text-gray-900 shadow-[0_0_15px_rgba(252,211,77,0.5)]" : "bg-indigo-900/30 border-indigo-400/40 text-indigo-200/70 group-hover:border-yellow-400/60 group-hover:text-yellow-300"
      )}
      whileTap={{ scale: 1.2, transition: { type: 'spring', stiffness: 300 } }}
    >{value}</motion.div>
  </label>
);

const ResultGauge = ({ label, score, maxScore }: { label: string, score: number, maxScore: number }) => {
    const percentage = (score / maxScore) * 100;
    return (
        <motion.div variants={itemVariants} className="space-y-2">
            <div className="flex justify-between items-center text-indigo-200/90 tracking-wider">
                <span className="font-semibold">{label}</span>
                <span className="font-bold">{score} / {maxScore}</span>
            </div>
            <div className="w-full bg-indigo-900/50 rounded-full h-3 border border-indigo-400/30">
                <motion.div 
                    className="bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full h-full shadow-lg shadow-yellow-500/20"
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, ease: "circOut", delay: 0.2 }}
                />
            </div>
        </motion.div>
    );
};

export default function TciTestPage() {
  const [answers, setAnswers] = useState<{ [key: string]: number }>({});
  const [showResults, setShowResults] = useState(false);
  const { toast } = useToast();
  const totalQuestionCount = useMemo(() => getTotalQuestions(), []);

  const results = useMemo(() => {
    if (!showResults) return null;
    const scores: { [key: string]: { score: number, maxScore: number, interpretation: string } } = {};
    Object.entries(questions).forEach(([group, data], groupIndex) => {
        let groupScore = 0;
        let maxGroupScore = 0;
        Object.entries(data.subfactors).forEach(([_, subfactorQuestions], subfactorIndex) => {
            subfactorQuestions.forEach((_, qIndex) => {
                const questionId = `q-${groupIndex}-${subfactorIndex}-${qIndex}`;
                groupScore += answers[questionId] || 0;
            });
            maxGroupScore += subfactorQuestions.length * 5;
        });
        const key = group.split(' (')[0];
        const interpretationEntry = interpretations[key as keyof typeof interpretations];
        
        if (!interpretationEntry) {
            console.error(`Interpretation not found for key: ${key}`);
            // Provide a default or skip this entry to prevent crashing
            return;
        }

        const interpretation = groupScore > maxGroupScore / 2 ? interpretationEntry.high : interpretationEntry.low;
        scores[group] = { score: groupScore, maxScore: maxGroupScore, interpretation };
    });
    return scores;
  }, [answers, showResults]);

  const handleAnswerChange = (questionId: string, value: number) => setAnswers(prev => ({ ...prev, [questionId]: value }));

  const handleSubmit = () => {
    if (Object.keys(answers).length < totalQuestionCount) {
      toast({ title: "마법서가 아직 완성되지 않았습니다!", description: "모든 질문에 답하여 당신의 운명을 확인하세요.", variant: "destructive" });
      return;
    }
    setShowResults(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    setAnswers({});
    setShowResults(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderQuestionForm = () => (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <Card className="bg-black/30 backdrop-blur-xl border border-yellow-600/30 rounded-2xl shadow-2xl shadow-black/50">
        <CardHeader className="text-center border-b border-yellow-600/20 pb-6">
          <BrainCircuit className="h-16 w-16 text-yellow-300/80 mx-auto mb-4" />
          <CardTitle className="text-2xl sm:text-3xl font-bold text-yellow-200 tracking-widest" style={{ textShadow: '0 0 10px rgba(252, 211, 77, 0.3)' }}>기질과 성격의 연금술</CardTitle>
          <CardDescription className="text-indigo-200/80 mt-2 tracking-wider">각 문항을 읽고 당신의 내면에 얼마나 해당하는지 선택해주세요.</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <Accordion type="single" collapsible className="w-full" defaultValue="item-0">
            {Object.entries(questions).map(([group, data], groupIndex) => (
              <AccordionItem key={groupIndex} value={`item-${groupIndex}`} className="border-yellow-800/40">
                <AccordionTrigger className="text-lg sm:text-xl font-semibold text-yellow-300/90 hover:text-yellow-200 tracking-wider py-4 text-left">{group}</AccordionTrigger>
                <AccordionContent className="space-y-8 pt-4">
                  {Object.entries(data.subfactors).map(([subfactorName, subfactorQuestions], subfactorIndex) => (
                    <div key={subfactorIndex} className="p-4 bg-indigo-900/20 rounded-lg border border-indigo-400/30">
                      <h4 className="font-semibold text-indigo-300 mb-4 tracking-widest">{subfactorName}</h4>
                      {subfactorQuestions.map((q, qIndex) => {
                        const questionId = `q-${groupIndex}-${subfactorIndex}-${qIndex}`;
                        return (
                          <motion.div key={questionId} variants={itemVariants} className="mb-6 last:mb-0">
                            <p className="font-medium text-gray-200 mb-4 text-base sm:text-lg tracking-wide">{q}</p>
                            <div className="flex justify-between items-center text-xs text-indigo-300/70 px-2">
                              <span>전혀 아님</span>
                              <div className="flex gap-2 sm:gap-3">
                                {[1, 2, 3, 4, 5].map(val => <RuneRadio key={val} questionId={questionId} value={val} checked={answers[questionId] === val} onChange={handleAnswerChange} />)}
                              </div>
                              <span>매우 그러함</span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
      <div className="text-center mt-10"><Button onClick={handleSubmit} size="lg" className="bg-gradient-to-br from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-gray-900 font-bold rounded-full shadow-lg shadow-yellow-500/20 transition-all transform hover:scale-105 px-12 py-6 text-lg tracking-widest">결과 봉인 해제</Button></div>
    </motion.div>
  );

  const renderResults = () => (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <Card className="bg-black/30 backdrop-blur-xl border border-yellow-600/30 rounded-2xl shadow-2xl shadow-black/50">
        <CardHeader className="text-center border-b border-yellow-600/20 pb-6">
          <Sparkles className="h-16 w-16 text-yellow-300/80 mx-auto mb-4 animate-pulse" />
          <CardTitle className="text-2xl sm:text-3xl font-bold text-yellow-200 tracking-widest" style={{ textShadow: '0 0 10px rgba(252, 211, 77, 0.3)' }}>당신의 연금술 결과</CardTitle>
          <CardDescription className="text-indigo-200/80 mt-2 tracking-wider">이 결과는 당신의 영혼의 지도를 보여주는 참고서입니다.</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-8 space-y-8">
          {results && Object.entries(results).map(([group, data]) => (
            <motion.div key={group} variants={itemVariants} className="p-4 bg-indigo-900/20 rounded-lg border border-indigo-400/30">
                <ResultGauge label={group} score={data.score} maxScore={data.maxScore} />
                <p className="text-indigo-200/90 mt-3 text-sm sm:text-base tracking-wide text-center">{data.interpretation}</p>
            </motion.div>
          ))}
        </CardContent>
      </Card>
      <div className="text-center mt-10"><Button onClick={handleReset} size="lg" variant="outline" className="border-indigo-400/50 text-indigo-200 hover:bg-indigo-900/50 hover:text-yellow-300 bg-transparent backdrop-blur-sm font-bold rounded-full shadow-lg transition-all transform hover:scale-105 px-12 py-6 text-lg tracking-widest"><RefreshCw className="mr-3 h-5 w-5" />다시하기</Button></div>
    </motion.div>
  );

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8 relative z-10">
      <header className="mb-8 sm:mb-12">
        <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5 }}
            className="flex items-center justify-between"
        >
            <Button asChild variant="ghost" className="text-indigo-300 hover:bg-indigo-800/50 hover:text-yellow-300">
                <Link href="/" className="flex items-center">
                    <ArrowLeft className="h-5 w-5 sm:mr-2" /> 
                    <span className="hidden sm:inline">돌아가기</span>
                </Link>
            </Button>
            
            <div className="text-center">
                <h1 className="text-2xl sm:text-4xl font-bold text-yellow-200 tracking-wider" style={{ textShadow: '0 0 15px rgba(252, 211, 77, 0.3)' }}>
                    TCI 자가 테스트
                </h1>
                <p className="text-xs sm:text-md text-indigo-200/80 mt-2 tracking-wider">나를 찾아 떠나는 심연으로의 여행</p>
            </div>

            <Button asChild variant="ghost" className="invisible">
                <Link href="/" className="flex items-center">
                    <ArrowLeft className="h-5 w-5 sm:mr-2" /> 
                    <span className="hidden sm:inline">돌아가기</span>
                </Link>
            </Button>
        </motion.div>
      </header>
      <main className="container mx-auto max-w-4xl">
        <AnimatePresence mode="wait">
          {showResults ? (
            <motion.div key="results" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>{renderResults()}</motion.div>
          ) : (
            <motion.div key="questions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{renderQuestionForm()}</motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}