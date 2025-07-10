'use client';

import React from 'react';
import { LineChartIcon as ChartLine, Newspaper, Calculator, CalendarDays, DollarSign, Brain } from 'lucide-react';
import { useRouter } from 'next/navigation'; // useRouter 임포트
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
  { value: 'portfolio', label: '포트폴리오', icon: DollarSign },
  { value: 'psychology-research', label: '심리', icon: Brain, isExternal: true }, // isExternal 추가
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
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#1C2534] border-t border-[#2D3A4B] shadow-lg md:hidden">
      <nav className="flex h-16 items-center justify-around px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.value; // activeTab은 여전히 내부 탭에만 적용
          return (
            <button
              key={item.value}
              onClick={() => handleNavClick(item.value, item.isExternal || false)}
              className={cn(
                "flex flex-col items-center justify-center p-2 rounded-md transition-colors duration-200",
                isActive ? "text-blue-400" : "text-gray-400 hover:text-gray-200"
              )}
            >
              <Icon className={cn("h-6 w-6", isActive ? "text-blue-400" : "text-gray-400")} />
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
