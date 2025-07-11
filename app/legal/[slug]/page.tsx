import { notFound } from 'next/navigation';
import BackButton from '@/components/ui/back-button';
import { Metadata } from 'next';

type PageSlug = 'privacy' | 'terms' | 'policy-safety' | 'copyright' | 'brand' | 'guidelines' | 'help';

const legalContent: { [key in PageSlug]: { title: string; content: React.ReactNode } } = {
  'privacy': {
    title: '개인정보 처리방침',
    content: (
      <div className="space-y-6 text-slate-300">
        <p>본 개인정보 처리방침은 원데이트레이딩(주) (이하 ‘회사’)가 제공하는 서비스에 적용됩니다.</p>
        <div className="space-y-2">
          <h3 className="font-bold text-lg text-white">1. 수집하는 개인정보의 항목</h3>
          <p>회사는 회원가입, 원활한 고객상담, 각종 서비스의 제공을 위해 아래와 같은 최소한의 개인정보를 필수항목으로 수집하고 있습니다.</p>
          <ul className="list-disc list-inside pl-4">
            <li>필수항목 : 이메일 주소, 비밀번호, 닉네임</li>
            <li>선택항목 : 프로필 사진</li>
            <li>자동수집 : 서비스 이용 기록, 접속 로그, 쿠키, 접속 IP 정보</li>
          </ul>
        </div>
        <div className="space-y-2">
          <h3 className="font-bold text-lg text-white">2. 개인정보의 수집 및 이용목적</h3>
          <p>회사는 수집한 개인정보를 다음의 목적을 위해 활용합니다. 이용자가 제공한 모든 정보는 하기 목적에 필요한 용도 이외로는 사용되지 않으며, 이용 목적이 변경될 시에는 사전 동의를 구할 것입니다.</p>
        </div>
      </div>
    )
  },
  'terms': {
    title: '이용약관',
    content: (
       <div className="space-y-6 text-slate-300">
        <div className="space-y-2">
          <h3 className="font-bold text-lg text-white">제1조 (목적)</h3>
          <p>이 약관은 원데이트레이딩(주) (이하 ‘회사’)가 운영하는 웹사이트에서 제공하는 인터넷 관련 서비스(이하 "서비스"라 한다)를 이용함에 있어 회사와 이용자의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.</p>
        </div>
        <div className="space-y-2">
          <h3 className="font-bold text-lg text-white">제2조 (정의)</h3>
          <p>"이용자"란 웹사이트에 접속하여 이 약관에 따라 회사가 제공하는 서비스를 받는 회원 및 비회원을 말합니다. "회원"이라 함은 회사에 개인정보를 제공하여 회원등록을 한 자로서, 회사의 정보를 지속적으로 제공받으며, 회사가 제공하는 서비스를 계속적으로 이용할 수 있는 자를 말합니다.</p>
        </div>
      </div>
    )
  },
  'policy-safety': {
    title: '정책 및 안전',
    content: <p className="text-slate-300">커뮤니티를 안전하게 유지하기 위한 정책입니다. 모든 사용자는 타인을 존중하고, 불법적인 콘텐츠를 공유하지 않아야 합니다.</p>
  },
  'copyright': {
    title: '저작권 정책',
    content: <p className="text-slate-300">서비스 내의 모든 콘텐츠는 저작권법의 보호를 받습니다. 무단 복제 및 배포를 금지하며, 위반 시 법적 조치를 받을 수 있습니다.</p>
  },
  'brand': {
    title: '브랜드 가이드라인',
    content: <p className="text-slate-300">회사의 로고, 상표 �� 브랜드 자산을 사용할 경우, 반드시 공식 가이드라인을 따라야 합니다. 자세한 내용은 문의 바랍니다.</p>
  },
  'guidelines': {
    title: '커뮤니티 가이드라인',
    content: <p className="text-slate-300">건강한 커뮤니티를 위해 욕설, 비방, 차별적인 발언을 삼가주세요. 모든 사용자가 즐겁게 소통할 수 있는 공간을 함께 만들어 갑시다.</p>
  },
  'help': {
    title: '도움말',
    content: <p className="text-slate-300">서비스 이용 중 문제가 발생하거나 궁금한 점이 있으시면, 고객센터(help@example.com)로 문의해주세요.</p>
  },
};

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const page = legalContent[params.slug as PageSlug];
  if (!page) {
    return {
      title: '문서 없음',
    };
  }
  return {
    title: `${page.title} - 대한민국 투자 플랫폼`,
  };
}

export default function LegalPage({ params }: { params: { slug: string } }) {
  const page = legalContent[params.slug as PageSlug];

  if (!page) {
    notFound();
  }

  return (
    <div className="bg-slate-900 min-h-screen">
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <div className="mb-8">
          <BackButton />
        </div>
        <article className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 sm:p-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6 border-b border-slate-700 pb-4">{page.title}</h1>
          {page.content}
        </article>
      </div>
    </div>
  );
}

export async function generateStaticParams() {
  return Object.keys(legalContent).map((slug) => ({
    slug,
  }));
}
