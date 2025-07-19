'use client';

import { useState } from 'react';
import { LayoutDashboard, User, Lock, Bell, Shield } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface SettingsNavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
}

const SettingsNavItem: React.FC<SettingsNavItemProps> = ({ href, icon, label, isActive }) => (
  <Link href={href} passHref>
    <motion.a
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-indigo-600 text-white shadow-md"
          : "text-gray-300 hover:bg-gray-700 hover:text-white"
      )}
    >
      {icon}
      {label}
    </motion.a>
  </Link>
);

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { href: '/settings/profile', icon: <User className="h-4 w-4" />, label: '프로필' },
    { href: '/settings/privacy', icon: <Shield className="h-4 w-4" />, label: '개인 정보' },
    { href: '/settings/notifications', icon: <Bell className="h-4 w-4" />, label: '알림' },
    { href: '/settings/account', icon: <Lock className="h-4 w-4" />, label: '계정' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl mx-auto grid lg:grid-cols-4 gap-6"
      >
        <aside className="lg:col-span-1 bg-gray-800 rounded-lg shadow-lg p-4 space-y-2">
          <h2 className="text-xl font-bold mb-4 text-indigo-400">설정</h2>
          <nav className="grid gap-1">
            {navItems.map((item) => (
              <SettingsNavItem
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                isActive={pathname === item.href}
              />
            ))}
          </nav>
        </aside>
        <main className="lg:col-span-3 bg-gray-800 rounded-lg shadow-lg p-6">
          {children}
        </main>
      </motion.div>
    </div>
  );
}