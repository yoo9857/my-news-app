import React from 'react';
import Link from 'next/link';
import { Copyright } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const footerLinks = [
    { name: '개인 정보 보호', href: '/legal/privacy' },
    { name: '약관', href: '/legal/terms' },
    { name: '정책 및 안전', href: '/legal/policy-safety' },
    { name: '저작권', href: '/legal/copyright' },
    { name: '브랜드', href: '/legal/brand' },
    { name: '가이드라인', href: '/legal/guidelines' },
    { name: '도움말', href: '/legal/help' },
  ];

  return (
    <footer className="hidden md:block bg-slate-900/50 border-t border-slate-800 text-slate-400 mt-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Policy Links */}
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
          {footerLinks.map((link) => (
            <Link key={link.name} href={link.href} className="hover:text-white transition-colors">
              {link.name}
            </Link>
          ))}
        </div>

        {/* Divider */}
        <div className="my-8 border-t border-slate-800"></div>

        {/* Company Info & Copyright */}
        <div className="text-center text-xs text-slate-500 space-y-3">
          <div className="space-y-1">
            <p>
              <span className="font-semibold text-slate-400">회사명:</span> 원데이트레이딩(주)
              <span className="mx-2 text-slate-600">|</span>
              <span className="font-semibold text-slate-400">대표:</span> 오한빈
            </p>
            <p>
              <span className="font-semibold text-slate-400">전담 전화:</span> 0000-0000 (24시간 연중무휴/유료)
            </p>
          </div>
          <div className="flex items-center justify-center pt-2">
            <Copyright size={14} className="mr-1.5" />
            <span>{currentYear} 원데이트레이딩(주). All rights reserved.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
