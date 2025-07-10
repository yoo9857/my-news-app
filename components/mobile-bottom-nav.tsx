'use client';

import React from 'react';
import { LineChartIcon as ChartLine, Newspaper, Calculator, CalendarDays, Briefcase, Brain } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface MobileBottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const navItems = [
  { value: 'explorer', label: '탐색', icon: ChartLine },
  { value: 'news', label: '뉴스', icon: Newspaper },
  { value: 'tools', label: '도구', icon: Calculator },
  { value: 'dailyPlan', label: '계획', icon: CalendarDays },
  { value: 'portfolio', label: '관리', icon: Briefcase },
  { value: 'psychology-research', label: '심리', icon: Brain, isExternal: true },
];

export default function MobileBottomNav({ activeTab, setActiveTab }: MobileBottomNavProps) {
  const router = useRouter();

  const handleNavClick = (value: string, isExternal: boolean) => {
    if (isExternal) {
      router.push(`/${value}`);
    } else {
      setActiveTab(value);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-slate-950/90 backdrop-blur-lg md:hidden">
      <nav className="flex h-16 items-center justify-around px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.value;
          return (
            <button
              key={item.value}
              onClick={() => handleNavClick(item.value, item.isExternal || false)}
              className={cn(
                "flex flex-1 flex-col items-center justify-center p-2 rounded-md transition-colors duration-200 focus:outline-none",
                isActive ? "text-white" : "text-slate-400 hover:text-white"
              )}
            >
              <Icon className="h-6 w-6" />
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}