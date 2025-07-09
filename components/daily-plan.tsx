// components/daily-plan.tsx
'use client'; // 클라이언트 컴포넌트임을 명시합니다.

import React, { useState } from 'react'; // useState를 사용하므로 임포트합니다.
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { ko } from "date-fns/locale"; // 한국어 로케일 임포트
import { Calendar as CalendarIcon } from "lucide-react"; // 아이콘 임포트
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast"; // 토스트 알림을 위해 추가

interface DailyPlanEntry {
  date: string;
  activities: string;
  notes: string;
}

const DailyInvestmentPlan: React.FC = () => {
  const [targetAmount, setTargetAmount] = useState<number | ''>('');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [dailyEntries, setDailyEntries] = useState<DailyPlanEntry[]>([]);
  const [currentActivity, setCurrentActivity] = useState('');
  const [currentNotes, setCurrentNotes] = useState('');
  const [selectedDateForEntry, setSelectedDateForEntry] = useState<Date | undefined>(new Date());

  const { toast } = useToast();

  const handleGeneratePlan = () => {
    if (!targetAmount || !startDate || !endDate || startDate >= endDate) {
      toast({
        title: "계획 생성 실패",
        description: "목표 금액, 시작일, 종료일을 정확히 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const dailyTarget = Number(targetAmount) / diffDays;

    toast({
      title: "투자 계획 생성 완료",
      description: `총 ${diffDays}일 동안 매일 약 ${dailyTarget.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}원씩 투자하세요.`,
      variant: "default",
    });

    // 여기서는 간단히 계획 생성 알림만, 실제 복잡한 계획 로직은 백엔드 또는 더 상세한 상태 관리 필요
  };

  const handleAddDailyEntry = () => {
    if (!selectedDateForEntry || !currentActivity.trim()) {
      toast({
        title: "일일 기록 추가 실패",
        description: "날짜와 활동 내용을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    const formattedDate = format(selectedDateForEntry, "yyyy-MM-dd", { locale: ko });
    const newEntry = {
      date: formattedDate,
      activities: currentActivity.trim(),
      notes: currentNotes.trim(),
    };

    setDailyEntries(prev => [...prev, newEntry].sort((a, b) => a.date.localeCompare(b.date)));
    setCurrentActivity('');
    setCurrentNotes('');
    toast({
      title: "일일 기록 추가 완료",
      description: `${formattedDate}에 대한 기록이 추가되었습니다.`,
    });
  };

  return (
    <Card className="bg-gray-800 text-gray-100 border-gray-700">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-white">2년 일일 투자 계획 및 기록</CardTitle>
        <CardDescription className="text-gray-400">
          개인의 투자 목표를 설정하고, 매일의 투자 활동을 기록하며 계획을 관리하세요.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 투자 계획 설정 섹션 */}
        <div>
          <h3 className="text-xl font-semibold text-white mb-4">투자 계획 설정</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="targetAmount" className="text-gray-300">목표 투자 금액 (원)</Label>
              <Input
                id="targetAmount"
                type="number"
                placeholder="예: 10000000 (천만원)"
                value={targetAmount}
                onChange={(e) => setTargetAmount(Number(e.target.value) || '')}
                className="bg-gray-700 border-gray-600 text-gray-100"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="startDate" className="text-gray-300">시작일</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={`w-full justify-start text-left font-normal bg-gray-700 border-gray-600 ${
                        !startDate ? "text-gray-400" : "text-gray-100"
                      }`}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP", { locale: ko }) : <span>날짜 선택</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-gray-700 border-gray-600 text-gray-100">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                      locale={ko}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex-1">
                <Label htmlFor="endDate" className="text-gray-300">종료일</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={`w-full justify-start text-left font-normal bg-gray-700 border-gray-600 ${
                        !endDate ? "text-gray-400" : "text-gray-100"
                      }`}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP", { locale: ko }) : <span>날짜 선택</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-gray-700 border-gray-600 text-gray-100">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                      locale={ko}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          <Button onClick={handleGeneratePlan} className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white">
            투자 계획 생성
          </Button>
        </div>

        <Separator className="bg-gray-700" />

        {/* 일일 투자 기록 섹션 */}
        <div>
          <h3 className="text-xl font-semibold text-white mb-4">일일 투자 기록</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="recordDate" className="text-gray-300">날짜 선택</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={`w-full justify-start text-left font-normal bg-gray-700 border-gray-600 ${
                      !selectedDateForEntry ? "text-gray-400" : "text-gray-100"
                    }`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDateForEntry ? format(selectedDateForEntry, "PPP", { locale: ko }) : <span>날짜 선택</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-gray-700 border-gray-600 text-gray-100">
                  <Calendar
                    mode="single"
                    selected={selectedDateForEntry}
                    onSelect={setSelectedDateForEntry}
                    initialFocus
                    locale={ko}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="md:col-span-1">
              <Label htmlFor="activity" className="text-gray-300">활동 내용 (필수)</Label>
              <Input
                id="activity"
                placeholder="예: 삼성전자 1주 매수, 뉴스 분석"
                value={currentActivity}
                onChange={(e) => setCurrentActivity(e.target.value)}
                className="bg-gray-700 border-gray-600 text-gray-100"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="notes" className="text-gray-300">추가 노트</Label>
              <Textarea
                id="notes"
                placeholder="오늘의 시장 동향, 투자 결정 이유 등"
                value={currentNotes}
                onChange={(e) => setCurrentNotes(e.target.value)}
                className="bg-gray-700 border-gray-600 text-gray-100 min-h-[80px]"
              />
            </div>
          </div>
          <Button onClick={handleAddDailyEntry} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
            기록 추가
          </Button>
        </div>

        <Separator className="bg-gray-700" />

        {/* 기록된 일일 활동 목록 */}
        <div>
          <h3 className="text-xl font-semibold text-white mb-4">내 일일 투자 기록</h3>
          {dailyEntries.length === 0 ? (
            <p className="text-gray-400 text-center">아직 기록된 활동이 없습니다.</p>
          ) : (
            <ScrollArea className="h-[300px] rounded-md border border-gray-700 p-4">
              <div className="space-y-4">
                {dailyEntries.map((entry, index) => (
                  <div key={index} className="bg-gray-700 p-3 rounded-md">
                    <p className="text-gray-300 font-semibold mb-1">{entry.date}</p>
                    <p className="text-white text-md">{entry.activities}</p>
                    {entry.notes && (
                      <p className="text-gray-400 text-sm mt-1">비고: {entry.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DailyInvestmentPlan;