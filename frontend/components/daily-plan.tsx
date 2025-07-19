'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import useLocalStorage from '@/hooks/use-local-storage';
import { PlusCircle, Trash2, Flag, Edit, Save, Book, StickyNote, ListChecks, ArrowLeft } from 'lucide-react';
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from '@/lib/utils';

// --- Types & Constants ---
type Priority = 'high' | 'medium' | 'low';
interface Task { id: number; text: string; completed: boolean; priority: Priority; }
interface Event { id: number; time: string; title: string; }
interface Note { id: number; title: string; content: string; }
interface DailyData { tasks: Task[]; events: Event[]; notes: Note[]; }

const priorityMap: { [key in Priority]: { label: string; color: string; } } = {
  high: { label: '중요', color: 'bg-red-500' },
  medium: { label: '보통', color: 'bg-yellow-500' },
  low: { label: '낮음', color: 'bg-blue-500' },
};

// --- Sub-components ---

const DailyDetailView = ({ selectedDate, data, onUpdate }: { selectedDate: Date; data: DailyData; onUpdate: (newData: DailyData) => void; }) => {
  const [newTask, setNewTask] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('medium');
  const [newEvent, setNewEvent] = useState('');
  const [newTime, setNewTime] = useState('12:00');
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [noteView, setNoteView] = useState<'list' | 'editor'>('list');

  useEffect(() => {
    setNoteView('list');
    setEditingNote(null);
  }, [selectedDate]);

  const handleUpdate = (field: keyof DailyData, value: any) => {
    const currentData = data || { tasks: [], events: [], notes: [] };
    onUpdate({ ...currentData, [field]: value });
  };

  const addTask = () => { if (newTask.trim()) { handleUpdate('tasks', [...data.tasks, { id: Date.now(), text: newTask, completed: false, priority: newPriority }]); setNewTask(''); setNewPriority('medium'); }};
  const toggleTask = (id: number) => handleUpdate('tasks', data.tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  const deleteTask = (id: number) => handleUpdate('tasks', data.tasks.filter(t => t.id !== id));
  
  const addEvent = () => { if (newEvent.trim()) { handleUpdate('events', [...data.events, { id: Date.now(), time: newTime, title: newEvent }].sort((a,b) => a.time.localeCompare(b.time))); setNewEvent(''); }};
  const deleteEvent = (id: number) => handleUpdate('events', data.events.filter(e => e.id !== id));

  const addNote = () => { const newNote: Note = { id: Date.now(), title: '새 노트', content: '' }; handleUpdate('notes', [...data.notes, newNote]); setEditingNote(newNote); setNoteView('editor'); };
  const updateNote = () => { if(editingNote) { handleUpdate('notes', data.notes.map(n => n.id === editingNote.id ? editingNote : n)); setNoteView('list'); }};
  const deleteNote = (id: number) => { handleUpdate('notes', data.notes.filter(n => n.id !== id)); setEditingNote(null); setNoteView('list'); };

  return (
    <Card className="bg-slate-800/50 border-slate-700 h-full flex flex-col">
      <CardHeader><CardTitle className="text-xl font-bold text-slate-200">{format(selectedDate, "yyyy년 MM월 dd일 (eee)", { locale: ko })}</CardTitle></CardHeader>
      <CardContent className="flex-grow flex flex-col">
        <Tabs defaultValue="planner" className="flex-grow flex flex-col">
          <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="planner"><ListChecks className="mr-2 h-4 w-4"/>플래너</TabsTrigger><TabsTrigger value="notes"><StickyNote className="mr-2 h-4 w-4"/>노트</TabsTrigger></TabsList>
          
          <TabsContent value="planner" className="flex-grow flex flex-col space-y-4 pt-4">
            {/* Events Section */}
            <Card className="bg-slate-900/50 border-slate-700/80">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-indigo-400">일정</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} className="bg-slate-800 border-slate-600 w-full sm:w-auto"/>
                  <Input placeholder="새로운 일정" value={newEvent} onChange={e => setNewEvent(e.target.value)} onKeyPress={e => e.key === 'Enter' && addEvent()} className="bg-slate-800 border-slate-600 flex-1"/>
                  <Button onClick={addEvent} className="bg-indigo-600 hover:bg-indigo-700 flex-shrink-0"><PlusCircle size={16} className="mr-2"/>추가</Button>
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                  {data.events.map(e => <div key={e.id} className="flex items-center gap-3 p-2.5 rounded-md bg-slate-800"><span className="font-bold text-indigo-300 w-14 text-sm">{e.time}</span><span className="flex-1 text-slate-200 text-sm break-all">{e.title}</span><Button onClick={() => deleteEvent(e.id)} variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-red-500 flex-shrink-0"><Trash2 size={16}/></Button></div>)}
                </div>
              </CardContent>
            </Card>
            
            {/* Tasks Section */}
            <Card className="bg-slate-900/50 border-slate-700/80">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-indigo-400">할 일</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input placeholder="새로운 할 일" value={newTask} onChange={e => setNewTask(e.target.value)} onKeyPress={e => e.key === 'Enter' && addTask()} className="bg-slate-800 border-slate-600 flex-1"/>
                  <Select value={newPriority} onValueChange={v => setNewPriority(v as Priority)}><SelectTrigger className="w-full sm:w-[120px] bg-slate-800 border-slate-600"><SelectValue placeholder="우선순위"/></SelectTrigger><SelectContent className="bg-slate-800 text-white">{Object.entries(priorityMap).map(([k,v])=><SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent></Select>
                  <Button onClick={addTask} className="bg-indigo-600 hover:bg-indigo-700 flex-shrink-0"><PlusCircle size={16} className="mr-2"/>추가</Button>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                  {data.tasks.map(t => <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-md bg-slate-800"><Checkbox id={`t-${t.id}`} checked={t.completed} onCheckedChange={() => toggleTask(t.id)} /><label htmlFor={`t-${t.id}`} className={cn("flex-1 text-sm", t.completed ? "line-through text-slate-500" : "text-slate-200")}>{t.text}</label><div className={cn("w-3 h-3 rounded-full flex-shrink-0", priorityMap[t.priority].color)} /><Button onClick={() => deleteTask(t.id)} variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-red-500 flex-shrink-0"><Trash2 size={16}/></Button></div>)}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes" className="flex-grow flex flex-col pt-4">
            <AnimatePresence mode="wait">
              {noteView === 'list' ? (
                <motion.div key="list" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="flex-grow flex flex-col">
                  <Button onClick={addNote} className="w-full mb-2"><PlusCircle size={16} className="mr-2"/>새 노트</Button>
                  <div className="space-y-2 flex-grow overflow-y-auto pr-2">{data.notes.map(n => <Button key={n.id} variant="ghost" onClick={() => {setEditingNote(n); setNoteView('editor');}} className="w-full justify-start truncate"><Book size={14} className="mr-2 flex-shrink-0"/>{n.title}</Button>)}</div>
                </motion.div>
              ) : (
                <motion.div key="editor" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="flex-grow flex flex-col space-y-2">
                  <div className="flex gap-2 items-center">
                    <Button onClick={() => setNoteView('list')} variant="outline" size="icon" className="flex-shrink-0"><ArrowLeft size={16}/></Button>
                    <Input value={editingNote?.title || ''} onChange={e => setEditingNote(prev => prev ? {...prev, title: e.target.value} : null)} placeholder="노트 제목" className="bg-slate-900/80 text-lg font-bold"/>
                    <Button onClick={updateNote} size="icon"><Save size={16}/></Button>
                    <Button onClick={() => deleteNote(editingNote!.id)} variant="destructive" size="icon"><Trash2 size={16}/></Button>
                  </div>
                  <Textarea value={editingNote?.content || ''} onChange={e => setEditingNote(prev => prev ? {...prev, content: e.target.value} : null)} placeholder="내용을 입력하세요..." className="bg-slate-900/80 flex-grow resize-none"/>
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

// --- Main Component ---
const ProDailyDashboard = () => {
  const [allData, setAllData] = useLocalStorage<Record<string, DailyData>>('pro-daily-dashboard', {});
  const [selectedDate, setSelectedDate] = useState(new Date());

  const handleDateUpdate = (dateKey: string, newData: DailyData) => {
    const currentData = allData[dateKey] || { tasks: [], events: [], notes: [] };
    setAllData({ ...allData, [dateKey]: {...currentData, ...newData} });
  };

  const selectedDateKey = format(selectedDate, "yyyy-MM-dd");
  
  const dayDataFromStorage = allData[selectedDateKey];
  const selectedDayData = {
    tasks: dayDataFromStorage?.tasks || [],
    events: dayDataFromStorage?.events || [],
    notes: dayDataFromStorage?.notes || [],
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-0"><Calendar mode="single" selected={selectedDate} onSelect={(date) => date && setSelectedDate(date)} className="w-full" components={{ DayContent: ({ date }) => { const dateKey = format(date, "yyyy-MM-dd"); const hasData = allData[dateKey] && (allData[dateKey].tasks.length > 0 || allData[dateKey].events.length > 0 || allData[dateKey].notes.length > 0); return (<div className="relative w-full h-full flex items-center justify-center"><span>{format(date, "d")}</span>{hasData && <div className="absolute bottom-1 w-1.5 h-1.5 bg-yellow-400 rounded-full" />}</div>);}}} /></CardContent>
        </Card>
      </div>
      <div className="md:col-span-2">
        <DailyDetailView selectedDate={selectedDate} data={selectedDayData} onUpdate={(newData) => handleDateUpdate(selectedDateKey, newData)} />
      </div>
    </div>
  );
};

export default React.memo(ProDailyDashboard);
