'use client';

import React from 'react';
import { Search, Newspaper, Calculator, DollarSign, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileBottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const navItems = [
  { value: 'explorer', label: '탐색', icon: Search },
  { value: 'news', label: '뉴스', icon: Newspaper },
  { value: 'tools', label: '도구', icon: Calculator },
  { value: 'dailyPlan', label: '계획', icon: CalendarDays },
  { value: 'portfolio', label: '포트폴리오', icon: DollarSign },
];

export default function MobileBottomNav({ activeTab, setActiveTab }: MobileBottomNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#1C2534] border-t border-[#2D3A4B] shadow-lg md:hidden">
      <nav className="flex h-16 items-center justify-around px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.value;
          return (
            <button
              key={item.value}
              onClick={() => setActiveTab(item.value)}
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
