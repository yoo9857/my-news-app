
import {
  ChartLine,
  Newspaper,
  Calculator,
  CalendarDays,
  DollarSign,
  Brain,
  MessageSquare,
} from "lucide-react";

export const navLinks = [
  {
    value: "explorer",
    label: "기업 탐색기",
    icon: ChartLine,
    href: "#",
  },
  {
    value: "news",
    label: "실시간 뉴스",
    icon: Newspaper,
    href: "#",
  },
  {
    value: "tools",
    label: "투자 분석 도구",
    icon: Calculator,
    href: "#",
  },
  {
    value: "dailyPlan",
    label: "일일 계획",
    icon: CalendarDays,
    href: "#",
  },
  {
    value: "community",
    label: "커뮤니티",
    icon: MessageSquare,
    href: "/board",
  },
  {
    value: "portfolio",
    label: "포트폴리오",
    icon: DollarSign,
    href: "#",
  },
  {
    value: "psychology-research",
    label: "심리 연구소",
    icon: Brain,
    href: "https://psychology.onedaytrading.net",
    isExternal: true,
  },
];
