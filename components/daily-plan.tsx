'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Calendar as CalendarIcon, PlusCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

interface DailyPlanEntry {
  id: number;
  date: string;
  activities: string;
  notes: string;
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
};

const DailyInvestmentPlan: React.FC = () => {
  const [targetAmount, setTargetAmount] = useState<number | ''>('');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [dailyEntries, setDailyEntries] = useState<DailyPlanEntry[]>([]);
  const [currentActivity, setCurrentActivity] = useState('');
  const [currentNotes, setCurrentNotes] = useState('');
  const [selectedDateForEntry, setSelectedDateForEntry] = useState<Date | undefined>(new Date());

  const { toast } = useToast();

  const handleAddDailyEntry = () => {
    if (!selectedDateForEntry || !currentActivity.trim()) {
      toast({ title: "기록 추가 실패", description: "날짜와 활동 내용을 입력해주세요.", variant: "destructive" });
      return;
    }
    const newEntry = {
      id: Date.now(),
      date: format(selectedDateForEntry, "yyyy-MM-dd"),
      activities: currentActivity.trim(),
      notes: currentNotes.trim(),
    };
    setDailyEntries(prev => [...prev, newEntry].sort((a, b) => b.date.localeCompare(a.date)));
    setCurrentActivity('');
    setCurrentNotes('');
    toast({ title: "기록 추가 완료", description: `${newEntry.date}의 활동이 기록되었습니다.` });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column: Entry Form */}
      <motion.div className="lg:col-span-1 space-y-6" variants={itemVariants}>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-300">일일 투자 기록</CardTitle>
            <CardDescription className="text-sm text-slate-400">오늘의 투자 활동을 기록하세요.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-400">날짜 선택</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant={"outline"} className="w-full justify-start text-left font-normal bg-slate-800 border-slate-600 hover:bg-slate-700 hover:text-slate-200">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDateForEntry ? format(selectedDateForEntry, "PPP", { locale: ko }) : <span>날짜 선택</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700 text-slate-200">
                  <Calendar mode="single" selected={selectedDateForEntry} onSelect={setSelectedDateForEntry} initialFocus locale={ko} />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="activity" className="text-sm font-medium text-slate-400">활동 내용 (필수)</Label>
              <Input id="activity" placeholder="예: 삼성전자 1주 매수" value={currentActivity} onChange={(e) => setCurrentActivity(e.target.value)} className="bg-slate-800 border-slate-600 text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-medium text-slate-400">추가 노트</Label>
              <Textarea id="notes" placeholder="시장 동향, 투자 결정 이유 등" value={currentNotes} onChange={(e) => setCurrentNotes(e.target.value)} className="bg-slate-800 border-slate-600 text-slate-200 min-h-[100px] placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
            <Button onClick={handleAddDailyEntry} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-2 group">
              <PlusCircle className="h-5 w-5 group-hover:rotate-90 transition-transform" />
              기록 추가
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Right Column: Log List */}
      <motion.div className="lg:col-span-2" variants={itemVariants}>
        <Card className="bg-slate-800/50 border-slate-700 h-full">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-300">투자 로그</CardTitle>
            <CardDescription className="text-sm text-slate-400">나의 투자 여정을 확인하세요.</CardDescription>
          </CardHeader>
          <CardContent>
            {dailyEntries.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-slate-400">아직 기록된 활동이 없습니다.</p>
                <p className="text-sm text-slate-500 mt-2">왼쪽 폼에서 첫 기록을 추가해보세요.</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {dailyEntries.map((entry) => (
                    <motion.div key={entry.id} layout variants={itemVariants} initial="hidden" animate="visible" className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50 hover:border-indigo-500/50 transition-colors">
                      <p className="text-sm font-semibold text-indigo-400 mb-1">{entry.date}</p>
                      <p className="text-slate-200">{entry.activities}</p>
                      {entry.notes && (
                        <p className="text-xs text-slate-400 mt-2 border-l-2 border-slate-600 pl-2">{entry.notes}</p>
                      )}
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default DailyInvestmentPlan;