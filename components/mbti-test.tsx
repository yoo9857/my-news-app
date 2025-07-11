'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Sparkles, ArrowLeft, Wind, Droplets, Mountain, Flame, RefreshCw, Star, Shield, Compass, BookOpen } from 'lucide-react';
import Link from 'next/link';

// --- Data & Interpretation ---
const mbtiQuestions = [
  { id: 'ei', category: '에너지의 원천', question: '당신은 주로 어디에서 영혼의 활력을 얻습니까?', icon: Flame, color: 'purple', options: [{ value: 'E', text: '외부 세계와의 교류 (외향)' }, { value: 'I', text: '내면 세계의 성찰 (내향)' }] },
  { id: 'sn', category: '세계의 인식', question: '당신은 세상을 어떻게 인식하고 받아들입니까?', icon: Mountain, color: 'teal', options: [{ value: 'S', text: '현실과 오감의 경험 (감각)' }, { value: 'N', text: '가능성과 육감의 통찰 (직관)' }] },
  { id: 'tf', category: '결정의 나침반', question: '당신은 어떤 나침반을 따라 중요한 결정을 내립��까?', icon: Wind, color: 'sky', options: [{ value: 'T', text: '논리와 이성의 법칙 (사고)' }, { value: 'F', text: '가치와 조화의 마음 (감정)' }] },
  { id: 'jp', category: '삶의 주문', question: '당신은 어떤 주문으로 삶을 이끌어갑니까?', icon: Droplets, color: 'rose', options: [{ value: 'J', text: '계획과 질서의 주문 (판단)' }, { value: 'P', text: '자유와 즉흥의 주문 (인식)' }] },
];

const mbtiInterpretations: { [key: string]: { title: string; description: string; keywords: { icon: React.ElementType; text: string }[] } } = {
    'ISTJ': { title: '세상의 소금', description: '현실적이고 책임감이 강하며, 질서와 전통을 중시하는 신뢰의 수호자입니다.', keywords: [{icon: Shield, text: '책임감'}, {icon: BookOpen, text: '논리'}, {icon: Compass, text: '정직'}] },
    'ISFJ': { title: '용감한 수호자', description: '따뜻하고 헌신적이며, 주변 사람들을 세심하게 보살피는 이타적인 마음의 소유자입니다.', keywords: [{icon: Shield, text: '헌신'}, {icon: Star, text: '공감'}, {icon: Compass, text: '보호'}] },
    'INFJ': { title: '선의의 옹호자', description: '깊은 통찰력과 강한 신념으로, 더 나은 세상을 만들기 위해 영감을 주는 예언가입니다.', keywords: [{icon: Star, text: '통찰력'}, {icon: BookOpen, text: '신념'}, {icon: Compass, text: '이타주의'}] },
    'INTJ': { title: '용의주도한 전략가', description: '뛰어난 상상력과 전략적 사고로, 복잡한 계획을 세우고 실현하는 위대한 설계자입니다.', keywords: [{icon: BookOpen, text: '전략'}, {icon: Compass, text: '독립성'}, {icon: Star, text: '상상력'}] },
    'ISTP': { title: '만능 재주꾼', description: '논리적이고 실용적이며, 도구와 기계를 다루는 데 탁월한 능력을 지닌 장인입니다.', keywords: [{icon: Compass, text: '실용성'}, {icon: BookOpen, text: '논리'}, {icon: Shield, text: '대담함'}] },
    'ISFP': { title: '호기심 많은 예술가', description: '온화하고 겸손하며, 예술적 감각과 뛰어난 미적 감각으로 세상을 아름답게 만드는 모험가입니다.', keywords: [{icon: Star, text: '예술성'}, {icon: Compass, text: '겸손'}, {icon: Shield, text: '유연성'}] },
    'INFP': { title: '열정적인 중재자', description: '이상주의적이고 낭만적이며, 긍정적인 세상을 만들기 위해 헌신하는 진실한 중재자입니다.', keywords: [{icon: Star, text: '이상주의'}, {icon: Compass, text: '진실성'}, {icon: BookOpen, text: '공감'}] },
    'INTP': { title: '논리적인 사색가', description: '지적 호기심이 왕성하며, 복잡한 이��과 아이디어를 탐구하는 혁신적인 사상가입니다.', keywords: [{icon: BookOpen, text: '논리'}, {icon: Star, text: '호기심'}, {icon: Compass, text: '독창성'}] },
    'ESTP': { title: '모험을 즐기는 사업가', description: '대담하고 현실적이며, 스릴과 위험을 즐기며 기회를 포착하는 명석한 사업가입니다.', keywords: [{icon: Shield, text: '대담함'}, {icon: Compass, text: '현실감각'}, {icon: Star, text: '에너지'}] },
    'ESFP': { title: '자유로운 영혼의 연예인', description: '즉흥적이고 사교적이며, 사람들에게 즐거움과 웃음을 선사하는 타고난 스타입니다.', keywords: [{icon: Star, text: '사교성'}, {icon: Shield, text: '즉흥성'}, {icon: Compass, text: '에너지'}] },
    'ENFP': { title: '재기발랄한 활동가', description: '열정적이고 창의적이며, 긍정적인 에너지로 사람들을 이끄는 자유로운 영혼의 소유자입니다.', keywords: [{icon: Star, text: '열정'}, {icon: Compass, text: '창의성'}, {icon: Shield, text: '사교성'}] },
    'ENTP': { title: '뜨거운 논쟁을 즐기는 변론가', description: '지적이고 독창적이며, 기존의 틀을 깨고 새로운 가능성을 탐색하는 것을 즐기는 발명가입니다.', keywords: [{icon: BookOpen, text: '독창성'}, {icon: Compass, text: '지성'}, {icon: Star, text: '논쟁'}] },
    'ESTJ': { title: '엄격한 관리자', description: '체계적이고 실용적이며, 규칙과 질서를 통해 조직을 이끄는 타고난 리더입니다.', keywords: [{icon: Shield, text: '체계성'}, {icon: Compass, text: '리더십'}, {icon: BookOpen, text: '결단력'}] },
    'ESFJ': { title: '사교적인 외교관', description: '타인에게 관심이 많고 사교적이며, 주변 사람들을 돕고 지지하는 데서 행복을 느끼는 조력자입니다.', keywords: [{icon: Star, text: '사교성'}, {icon: Shield, text: '조화'}, {icon: Compass, text: '협력'}] },
    'ENFJ': { title: '정의로운 사회운동가', description: '카리스마와 이상을 겸비하여, 사람들을 이끌고 세상에 긍정적인 영향을 미치는 지도자입니다.', keywords: [{icon: Compass, text: '카리스마'}, {icon: Star, text: '이상'}, {icon: Shield, text: '리더십'}] },
    'ENTJ': { title: '대담한 통솔자', description: '결단력과 통솔력으로, 목표를 향해 사람들을 이끌고 위대한 비전을 실현하는 지도자입니다.', keywords: [{icon: Shield, text: '통솔력'}, {icon: BookOpen, text: '결단력'}, {icon: Compass, text: '비전'}] },
};

// --- Animation Variants ---
const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.2 } } };
const itemVariants = { hidden: { opacity: 0, y: 20, scale: 0.95 }, visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 100 } } };

// --- UI Components ---
const ElementRadio = ({ questionId, value, text, checked, onChange, color }: any) => (
  <label className="relative flex flex-col items-center justify-center cursor-pointer w-full group">
    <input type="radio" name={questionId} value={value} onChange={() => onChange(questionId, value)} checked={checked} className="sr-only" required />
    <motion.div
      className={cn("w-full p-4 sm:p-5 rounded-lg flex items-center justify-center border-2 transition-all duration-300 text-center text-sm sm:text-base font-semibold tracking-wider", `border-${color}-500/40`,
        checked ? `bg-${color}-500/80 border-${color}-400 text-white shadow-[0_0_20px_rgba(192,132,252,0.5)]` : `bg-gray-900/30 text-gray-300 group-hover:border-${color}-500/70 group-hover:text-white group-hover:bg-${color}-900/20`
      )}
      whileTap={{ scale: 0.95 }}
    >{text}</motion.div>
  </label>
);

export default function MbtiTest() {
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [showResults, setShowResults] = useState(false);
  const { toast } = useToast();

  const mbtiType = useMemo(() => {
    if (Object.keys(answers).length !== mbtiQuestions.length) return null;
    return mbtiQuestions.map(q => answers[q.id]).join('');
  }, [answers]);

  const handleAnswerChange = (questionId: string, value: string) => setAnswers(prev => ({ ...prev, [questionId]: value }));

  const handleSubmit = () => {
    if (!mbtiType) {
      toast({ title: "운명의 네 원소가 아직 모이지 않았습니다!", description: "모든 질문에 답하여 당신의 성격 유형을 확인하세요.", variant: "destructive" });
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
      <Card className="bg-black/30 backdrop-blur-xl border border-purple-600/30 rounded-2xl shadow-2xl shadow-black/50">
        <CardHeader className="text-center border-b border-purple-600/20 pb-6">
          <Sparkles className="h-16 w-16 text-purple-300/80 mx-auto mb-4" />
          <CardTitle className="text-2xl sm:text-3xl font-bold text-purple-200 tracking-widest" style={{ textShadow: '0 0 10px rgba(192, 132, 252, 0.3)' }}>네 가지 원소 성격 유형</CardTitle>
          <CardDescription className="text-indigo-200/80 mt-2 tracking-wider">각 문항을 읽고 당신의 마음에 더 가까운 쪽을 선택해주세요.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 sm:space-y-10 p-4 sm:p-8">
          {mbtiQuestions.map((q) => {
            const Icon = q.icon;
            return (
              <motion.div key={q.id} variants={itemVariants} className={cn("p-4 sm:p-6 rounded-lg border-2", `border-${q.color}-500/30 bg-gradient-to-br from-${q.color}-900/20 to-transparent`)}>
                <div className="flex items-center mb-4">
                  <Icon className={cn("h-7 w-7 sm:h-8 sm:w-8 mr-4", `text-${q.color}-400`)} />
                  <h4 className={cn("font-semibold text-lg sm:text-xl tracking-wider", `text-${q.color}-300`)}>{q.category}</h4>
                </div>
                <p className="font-medium text-gray-200 mb-5 text-base sm:text-lg tracking-wide">{q.question}</p>
                <div className="flex flex-col sm:flex-row gap-4">
                  {q.options.map(option => <ElementRadio key={option.value} questionId={q.id} value={option.value} text={option.text} checked={answers[q.id] === option.value} onChange={handleAnswerChange} color={q.color} />)}
                </div>
              </motion.div>
            )
          })}
        </CardContent>
      </Card>
      <div className="text-center mt-10"><Button onClick={handleSubmit} size="lg" className="bg-gradient-to-br from-purple-600 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 text-white font-bold rounded-full shadow-lg shadow-purple-500/20 transition-all transform hover:scale-105 px-12 py-6 text-lg tracking-widest">운명의 서 펼치기</Button></div>
    </motion.div>
  );

  const renderResults = () => {
    const result = mbtiType ? mbtiInterpretations[mbtiType] : null;
    if (!result) return null;

    return (
      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        <Card className="bg-black/30 backdrop-blur-xl border border-purple-600/30 rounded-2xl shadow-2xl shadow-black/50 text-center overflow-hidden">
          <CardHeader className="bg-gradient-to-br from-purple-900/30 to-transparent pt-8 pb-6">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1, transition: { delay: 0.2, type: 'spring', stiffness: 150 } }}>
              <Sparkles className="h-16 w-16 text-purple-300/80 mx-auto mb-4 animate-pulse" />
            </motion.div>
            <CardTitle className="text-2xl sm:text-3xl font-bold text-purple-200 tracking-widest" style={{ textShadow: '0 0 10px rgba(192, 132, 252, 0.3)' }}>{result.title}</CardTitle>
            <div className="text-5xl sm:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-purple-300 to-indigo-400 my-2 tracking-widest">{mbtiType}</div>
          </CardHeader>
          <CardContent className="p-6 sm:p-8">
            <motion.p variants={itemVariants} className="text-indigo-200/90 text-base sm:text-lg tracking-wide mb-8">{result.description}</motion.p>
            <motion.div variants={itemVariants} className="space-y-4">
              <h3 className="text-lg font-semibold text-purple-300 tracking-wider">주요 키워드</h3>
              <div className="flex flex-wrap justify-center gap-4">
                {result.keywords.map((kw, i) => {
                  const Icon = kw.icon;
                  return (
                    <div key={i} className="flex items-center gap-2 bg-indigo-900/40 border border-indigo-400/30 rounded-full px-4 py-2">
                      <Icon className="h-5 w-5 text-purple-300" />
                      <span className="text-indigo-200 font-medium tracking-wider">{kw.text}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </CardContent>
        </Card>
        <div className="text-center mt-10"><Button onClick={handleReset} size="lg" variant="outline" className="border-indigo-400/50 text-indigo-200 hover:bg-indigo-900/50 hover:text-purple-300 bg-transparent backdrop-blur-sm font-bold rounded-full shadow-lg transition-all transform hover:scale-105 px-12 py-6 text-lg tracking-widest"><RefreshCw className="mr-3 h-5 w-5" />다시하기</Button></div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8 relative z-10">
       <header className="mb-8 sm:mb-12">
        <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5 }}
            className="flex items-center justify-between"
        >
            <Button asChild variant="ghost" className="text-indigo-300 hover:bg-indigo-800/50 hover:text-purple-300">
                <Link href="/" className="flex items-center">
                    <ArrowLeft className="h-5 w-5 sm:mr-2" /> 
                    <span className="hidden sm:inline">돌아가기</span>
                </Link>
            </Button>
            
            <div className="text-center">
                <h1 className="text-2xl sm:text-4xl font-bold text-purple-200 tracking-wider" style={{ textShadow: '0 0 15px rgba(192, 132, 252, 0.3)' }}>
                    MBTI 원소 테스트
                </h1>
                <p className="text-xs sm:text-md text-indigo-200/80 mt-2 tracking-wider">당신의 성격에 깃든 원소를 찾는 여정</p>
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
