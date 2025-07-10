'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils'; // For conditional class names

// Define interfaces for data structure
interface QuestionItem {
  text: string;
}

interface Subfactor {
  [key: string]: string[]; // Subfactor name maps to an array of questions
}

interface QuestionGroup {
  subfactors: Subfactor;
}

interface InterpretationDetail {
  title: string;
  detail: string;
  celebrity: string;
  advice: { [key: string]: string };
  reflection: string[];
}

interface InterpretationSubfactor {
  high: string;
  low: string;
}

interface InterpretationGroup {
  type: '기질' | '성격';
  high: InterpretationDetail;
  low: InterpretationDetail;
  subfactors: { [key: string]: InterpretationSubfactor };
}

// Data from the provided HTML
const questions: { [key: string]: QuestionGroup } = {
    '자극 추구 (Novelty Seeking)': {
        subfactors: {
            '탐색적 흥분': ["새롭고 신기한 것을 보면 일단 해보고 싶다.", "모험이나 스릴을 즐기는 편이다.", "예측 불가능한 상황에서 오히려 흥미를 느낀다."],
            '충동성': ["때로는 결과를 생각하기 전에 행동부터 할 때가 있다.", "쉽게 지루함을 느끼고, 즉흥적으로 행동하는 것을 좋아한다.", "기분 전환을 위해 돈을 쓰거나 새로운 것을 사는 경우가 잦다.", "하나의 일에 오래 집중하는 것이 어렵게 느껴진다."],
            '무절제': ["규칙이나 절차에 얽매이는 것을 답답해한다.", "감정 표현이 풍부하고, 하고 싶은 말은 하는 편이다.", "전통적인 방식보다는 나만의 새로운 방식을 시도하는 것을 선호한다."]
        }
    },
    '위험 회피 (Harm Avoidance)': {
        subfactors: {
            '예기 불안': ["처음 해보는 일이나 불확실한 상황이 걱정되고 불안하다.", "사소한 일에도 걱정을 많이 하는 편이다.", "최악의 상황을 먼저 상상하며 대비하려는 경향이 있다."],
            '불확실성에 대한 두려움': ["어떤 일을 시작하기 전에 미리 꼼꼼하게 계획하고 준비한다.", "예상치 못한 변화가 생기면 당황스럽다.", "결정이 내려진 일이 바뀌는 것을 매우 싫어한다.", "명확한 가이드라인이나 지침이 있는 일을 선호한다."],
            '수줍음': ["낯선 사람을 만나면 쉽게 긴장하고 수줍음을 탄다.", "사람들 앞에서 발표하거나 주목받는 것을 피하고 싶다.", "새로운 모임이나 집단에 들어가는 것이 어색하고 힘들다."]
        }
    },
    '사회적 민감성 (Reward Dependence)': {
        subfactors: {
            '정서적 감수성': ["다른 사람의 칭찬이나 인정에 기분이 많이 좌우된다.", "정이 많고 눈물이 많다는 말을 자주 듣는다.", "다른 사람의 미묘한 감정 변화를 잘 알아차린다.", "드라마나 영화를 보며 주인공의 감정에 깊이 몰입한다.", "다른 사람의 비판이나 거절에 쉽게 상처받는다."],
            '사회적 애착': ["다른 사람의 감정에 깊이 공감하고, 남을 돕는 것을 좋아한다.", "한번 인연을 맺은 사람들과 오래 관계를 유지하고 싶다.", "혼자 있는 것보다 다른 사람들과 함께 있을 때 더 힘이 난다.", "주변 사람들의 기념일이나 중요한 일을 잘 챙긴다.", "사람들과의 관계가 틀어지면 큰 스트레스를 받는다."]
        }
    },
    '인내력 (Persistence)': {
        subfactors: {
            '끈기': ["일이 힘들고 지치더라도 한번 시작하면 끝까지 해내려고 한다.", "목표를 달성하기 위해 당장의 즐거움을 미룰 수 있다.", "단기적인 성과가 보이지 않아도 꾸준히 노력할 수 있다.", "어려운 문제를 만나면 해결될 때까지 붙들고 있는다.", "반복적인 작업도 목표를 위해서라면 잘 참아낼 수 있다."],
            '완벽주의': ["내가 한 일에 대해 높은 기준을 가지고 있다.", "사소한 실수도 그냥 넘어가지 못하고 수정해야 직성이 풀린다.", "다른 사람들도 나만큼 열심히 해주기를 기대한다.", "과정보다 결과의 완벽함이 더 중요하다고 생각한다.", "어떤 일이든 최고가 되고 싶다는 욕심이 있다."]
        }
    },
    '자율성 (Self-Directedness)': {
        subfactors: {
            '책임감': ["나는 내 삶의 주인이 나 자신이라고 확신한다.", "자신의 선택과 행동에 대해 스스로 책임지려 한다.", "어떤 결과가 나오든 남의 탓으로 돌리지 않는다."],
            '목표의식': ["나에게는 명확한 인생의 목표나 방향이 있다.", "어려움이 닥쳐도 스스로 해결할 방법을 찾을 수 있다.", "목표를 이루기 위해 구체적인 계획을 세우고 실천한다.", "나는 내가 원하는 것이 무엇인지 분명히 알고 있다."],
            '자기수용': ["나는 나의 장점과 단점을 포함해 나 자신을 있는 그대로 받아들인다.", "자신에 대한 자부심을 느끼며 만족스럽다.", "실패하더라도 나 자신을 질책하기보다 격려하는 편이다."]
        }
    },
    '연대감 (Cooperativeness)': {
        subfactors: {
            '타인수용': ["나는 다른 사람들을 조건 없이 이해하고 수용하려고 노력한다.", "나와 다른 가치관을 가진 사람도 존중할 수 있다.", "사람들의 단점보다는 장점을 먼저 보려고 한다."],
            '공감능력': ["다른 사람의 입장에서 생각하는 것이 어렵지 않다.", "타인의 슬픔이나 기쁨을 내 일처럼 느낄 때가 많다.", "다른 사람이 말을 할 때, 그 사람의 감정을 느끼며 듣는다.", "다른 사람의 어려움을 보면 그냥 지나치지 못한다."],
            '이타주의': ["공동체의 이익을 위해 기꺼이 내 것을 양보할 수 있다.", "사람들은 기본적으로 선하고 신뢰할 만하다고 생각한다.", "다른 사람을 돕는 것에서 보람과 행복을 느낀다."]
        }
    },
    '자기초월 (Self-Transcendence)': {
        subfactors: {
            '창조적 자기망각': ["자연의 아름다움이나 예술 작품을 보며 깊은 감동을 느낄 때가 많다.", "상상에 깊이 빠져들거나 몽상을 즐기는 편이다.", "어떤 일에 몰두하면 시간 가는 줄 모를 때가 자주 있다.", "아름다운 것을 보면 그 순간을 온전히 느끼고 싶어 한다.", "직관이나 영감을 중요하게 생각한다."],
            '우주만물과의 일체감': ["때때로 세상 만물과 내가 하나로 연결된 듯한 느낌을 받는다.", "물질적인 성공보다 영적인 가치나 깨달음이 더 중요하다고 생각한다.", "세상의 모든 생명은 소중하며 서로 연결되어 있다고 믿는다.", "욕심을 내려놓을 때 마음의 평화를 얻는다.", "나 자신을 넘어서는 더 큰 존재나 원리를 느낄 때가 있다."]
        }
    }
};

const interpretations: { [key: string]: InterpretationGroup } = {
    '자극 추구 (Novelty Seeking)': {
        type: '기질',
        high: {
            title: "에너지가 넘치는 탐험가",
            detail: "당신은 호기심이라는 강력한 엔진을 장착하고, 늘 새로운 경험이라는 연료를 찾아 나섭니다. 단조로운 일상보다는 변화와 모험이 가득한 삶에서 활력을 얻습니다. 이 에너지는 창의성, 혁신, 빠른 적응력의 원천이 됩니다. 하지만 때로는 이 엔진이 과열되어 성급한 결정이나 쉽게 싫증 내는 모습으로 나타날 수 있습니다. 당신의 탐험가적 기질은 '어디로' 향하게 하느냐에 따라 위대한 발견을 할 수도, 길을 잃고 헤맬 수도 있는 강력한 힘입니다.",
            celebrity: "노홍철, 덱스 (새로운 도전을 두려워하지 않고, 넘치는 에너지로 주변에 활력을 불어넣는 유형)",
            advice: {
                "업무/학업": "당신의 호기심을 프로젝트의 '아이디어 발상' 단계에 집중시켜보세요. 브레인스토밍이나 새로운 기술 리서치에서 뛰어난 능력을 발휘할 수 있습니다. 다만, 장기 프로젝트에서는 중간 목표를 잘게 쪼개어 작은 성취감을 자주 느끼는 것이 완주에 도움이 됩니다.",
                "인간관계": "새로운 사람들을 만나는 것을 즐기는 당신은 관계의 폭을 넓히는 데 능숙합니다. 하지만 깊이를 더하기 위해서는, 기존 관계에 의식적으로 시간과 노력을 투자하는 것이 중요합니다. 상대방의 익숙한 모습 속에서 새로운 매력을 발견해보려는 노력은 어떨까요?",
                "개인 성장": "충동적인 소비나 결정을 내리기 전에 '24시간 규칙'을 만들어보세요. 하루 동안 생각한 뒤에도 여전히 좋은 결정이라고 생각된다면 그때 실행하는 것입니다. 이를 통해 당신의 에너지를 파괴적인 방향이 아닌, 건설적인 방향으로 사용하는 훈련을 할 수 있습니다."
            },
            reflection: [
                "최근 당신의 호기심 때문에 새롭게 시작했던 일 중 가장 즐거웠던 것은 무엇인가요?",
                "당신의 '충동성'이 긍정적인 결과로 이어진 경험이 있나요? 반대로 후회했던 경험은 무엇인가요?",
                "지루함을 느낄 때, 당신은 주로 어떻게 대처하나요? 그 방식이 당신에게 도움이 되나요?"
            ]
        },
        low: {
            title: "신중하고 안정적인 사색가",
            detail: "당신은 익숙하고 예측 가능한 환경에서 편안함을 느낍니다. 일을 시작하기 전에 신중하게 분석하고, 체계적으로 접근하는 것을 선호합니다. 덕분에 안정적이고 신뢰감 있는 결과를 만들어냅니다. 차분하고 꾸준하지만, 때로는 좋은 기회를 놓치거나 변화에 대한 저항감을 느껴 정체될 수 있습니다. 당신의 신중함은 실수를 줄이는 훌륭한 자산입니다.",
            celebrity: "유재석, 이서진 (자신만의 루틴을 중요시하고, 예측 가능한 안정적인 상황에서 편안함을 느끼는 유형)",
            advice: {
                "업무/학업": "당신은 세밀한 계획 수립, 데이터 분석, 품질 관리 등 안정성과 정확성이 요구되는 분야에서 강점을 보입니다. 급변하는 환경에서는 스트레스를 받을 수 있으니, 변화가 예상될 때 미리 정보를 수집하고 대비할 시간을 갖는 것이 좋습니다.",
                "인간관계": "당신은 소수의 사람과 깊고 안정적인 관계를 맺는 것을 선호합니다. 이는 진실한 관계를 만드는 데 도움이 됩니다. 다만, 새로운 관계에 마음을 여는 데 시간이 걸릴 수 있으니, 작은 스몰톡이나 가벼운 교류부터 시작하며 천천히 다가가는 것도 좋은 방법입니다.",
                "개인 성장": "가끔은 일상에서 벗어나 '계획 없는 하루'를 보내보는 것은 어떨까요? 익숙한 길 대신 새로운 길로 산책하거나, 평소에 가보지 않았던 식당에 가보는 것처럼, 작은 모험이 삶에 새로운 활력을 줄 수 있습니다."
            },
            reflection: [
                "당신의 신중함 덕분에 위기를 모면했거나 좋은 결과를 얻었던 경험이 있나요?",
                "변화가 필요하다고 느꼈지만, 막상 시도하기를 주저했던 경험이 있나요? 그 이유는 무엇이었나요?",
                "당신이 '안정감'을 느끼는 것은 구체적으로 무엇인가요? (장소, 사람, 활동 등)"
            ]
        },
        subfactors: {
            '탐색적 흥분': { high: "스릴과 모험을 적극적으로 즐깁니다.", low: "안전과 안정을 무엇보다 중요하게 생각합니다." },
            '충동성': { high: "즉흥적이고 빠른 결정을 내립니다.", low: "심사숙고하며 계획적으로 행동합니다." },
            '무절제': { high: "자유분방하고 규칙에 얽매이지 않습니다.", low: "질서와 규칙을 존중하고 잘 따릅니다." }
        }
    },
    '위험 회피 (Harm Avoidance)': {
        type: '기질',
        high: {
            title: "신중하고 섬세한 안전 관리자",
            detail: "당신은 위험을 미리 감지하는 예민한 레이더를 가지고 있으며, 일을 처리할 때 꼼꼼하고 신중합니다. 덕분에 실수가 적고 안정적인 결과를 만들어냅니다. 다른 사람들이 놓치는 잠재적 문제점을 발견하는 능력이 탁월합니다. 하지만 과도한 걱정과 불안으로 쉽게 지치거나, 새로운 시도를 하는 데 큰 어려움을 겪을 수 있습니다. 때로는 걱정이 행동을 마비시키기도 합니다.",
            celebrity: "서장훈, 안정환 (미래에 대한 걱정이 많고, 꼼꼼하게 계획하고 확인해야 안심하는 유형)",
            advice: {
                "업무/학업": "리스크 관리, 법무, 회계, 교정/교열 등 세심함과 정확성이 요구되는 일에 재능이 있습니다. 다만, 의사결정을 내려야 할 때 과도한 분석으로 시기를 놓치지 않도록 '최악'이 아닌 '최선'의 시나리오를 그려보는 연습을 해보세요.",
                "인간관계": "당신은 상대방에게 상처를 주지 않으려 매우 조심스럽게 행동합니다. 이는 배려심으로 비칠 수 있습니다. 하지만 자신의 의견을 표현하는 것을 두려워하면 관계가 깊어지기 어렵습니다. '나 전달법(I-message)'을 활용하여 자신의 감정과 생각을 부드럽게 표현하는 연습이 필요합니다.",
                "개인 성장": "걱정이 떠오를 때, 그 걱정이 '현실적인 문제'인지 '상상 속의 불안'인지 구분해보세요. '걱정하는 시간'을 따로 정해두고 그 시간에만 집중적으로 걱정하는 것도 불안을 다루는 좋은 방법입니다. 또한, 명상이나 심호흡은 불안을 줄이는 데 실질적인 도움이 됩니다."
            },
            reflection: [
                "최근 당신을 가장 불안하게 했던 걱정은 무엇이었나요? 그 걱정은 실제로 일어났나요?",
                "당신의 조심성 때문에 좋은 기회를 놓쳤다고 생각한 적이 있나요?",
                "당신이 '안전하다'고 느끼기 위해 꼭 필요한 조건은 무엇인가요?"
            ]
        },
        low: {
            title: "대담하고 낙천적인 도전자",
            detail: "당신은 자신감이 넘치고, 웬만한 어려움에는 잘 흔들리지 않는 강한 멘탈의 소유자입니다. 실패에 대한 두려움이 적어 새로운 일에 과감하게 도전하는 용기가 있습니다. 스트레스 상황에서도 침착함을 유지하며 긍정적인 태도를 잃지 않습니다. 하지만 때로는 위험을 간과하거나 지나치게 낙관하여 곤란한 상황에 처할 수 있습니다.",
            celebrity: "기안84, 박나래 (실패를 두려워하지 않고, 일단 부딪혀보는 대담하고 긍정적인 에너지를 가진 유형)",
            advice: {
                "업무/학업": "새로운 프로젝트를 시작하거나, 위기 상황을 돌파하는 데 뛰어난 리더십을 발휘할 수 있습니다. 당신의 긍정적인 에너지는 팀에 활력을 줍니다. 다만, 중요한 결정을 내리기 전에는 의도적으로 '반대 의견'이나 '잠재적 위험'을 찾아보는 시간을 가져 균형을 맞추는 것이 좋습니다.",
                "인간관계": "당신은 시원시원하고 솔직한 태도로 사람들에게 다가갑니다. 하지만 때로는 당신의 대담함이 다른 사람에게는 무모하거나 배려가 부족하게 느껴질 수 있습니다. 상대방의 조심스러운 태도를 '답답함'으로 여기기보다, 그 사람의 신중함을 존중해주는 자세가 필요합니다.",
                "개인 성장": "도전하기 전에 '최악의 경우 무엇을 잃게 될까?'를 한번쯤 생각해보는 습관은 당신의 도전을 더 안전하게 만들어줍니다. 성공 경험뿐만 아니라, 실패 경험을 통해 무엇을 배웠는지 성찰하는 시간은 당신을 더 지혜로운 도전자로 만들어 줄 것입니다."
            },
            reflection: [
                "당신의 대담함 덕분에 얻었던 가장 큰 성과는 무엇인가요?",
                "돌이켜보면 '조금 더 신중했더라면' 하고 아쉬웠던 경험이 있나요?",
                "당신은 '실패'를 어떻게 정의하나요?"
            ]
        },
        subfactors: {
            '예기 불안': { high: "일어나지 않은 일에 대해 미리 걱정하는 경향이 있습니다.", low: "느긋하고 낙천적이며, 미래를 긍정적으로 봅니다." },
            '불확실성에 대한 두려움': { high: "계획과 예측 가능성을 중시하며, 변화를 불편해합니다.", low: "변화와 불확실성에 개방적이고 잘 적응합니다." },
            '수줍음': { high: "낯선 상황이나 사람 앞에서 쉽게 긴장하고 위축됩니다.", low: "사교적이고 대담하며, 주목받는 것을 즐깁." }
        }
    },
    '사회적 민감성 (Reward Dependence)': {
        type: '기질',
        high: {
            title: "따뜻하고 정이 많은 공감 능력자",
            detail: "당신은 사람들과의 관계를 매우 소중히 여기며, 타인의 감정에 깊이 공감하는 능력이 탁월합니다. 주변 사람들을 잘 챙기고, 그들의 기쁨과 슬픔을 함께 나누는 데서 큰 행복을 느낍니다. 당신의 따뜻함은 주변을 밝히는 등불과 같습니다. 하지만 타인의 반응에 지나치게 신경 쓰거나, 거절을 잘 못해서 상처받거나 자신의 에너지를 소진하기 쉽습니다.",
            celebrity: "아이유, 박보검 (팬과 주변 사람들을 잘 챙기고, 선한 영향력을 통해 유대감을 형성하려는 따뜻한 유형)",
            advice: {
                "업무/학업": "상담, 교육, 사회복지, 팀 관리 등 사람들과 교류하고 협력하는 역할에서 빛을 발합니다. 팀의 화합을 이끌고 긍정적인 분위기를 만드는 데 기여합니다. 다만, 공과 사를 구분하고, 감정적인 교류와 별개로 객관적인 피드백을 주고받는 연습이 필요합니다.",
                "인간관계": "당신은 깊고 친밀한 관계를 맺는 데 능숙합니다. 하지만 모든 사람을 만족시키려 애쓰다 보면 정작 자신을 돌보지 못할 수 있습니다. 때로는 나의 감정과 욕구를 먼저 챙기는 건강한 이기심도 필요하다는 것을 기억하세요.",
                "개인 성장": "거절하는 연습을 해보세요. 작은 부탁부터 '미안하지만 지금은 어려울 것 같아'라고 말해보는 것입니다. 또한, 타인의 인정이 아닌 나 자신의 내면의 목소리에 귀 기울이는 시간을 가져보세요. '나는 지금 무엇을 느끼고, 무엇을 원하는가?'"
            },
            reflection: [
                "최근 다른 사람을 도우면서 가장 큰 보람을 느꼈던 순간은 언제인가요?",
                "다른 사람의 기대를 저버릴까 봐, 또는 관계가 나빠질까 봐 원치 않는 부탁을 들어준 경험이 있나요?",
                "당신이 진정으로 마음을 터놓고 의지할 수 있는 사람은 누구인가요?"
            ]
        },
        low: {
            title: "독립적이고 주관이 뚜렷한 개인주의자",
            detail: "당신은 독립적이며, 자신의 판단과 신념에 따라 행동하는 것을 중요하게 생각합니다. 타인의 평가나 시선에 크게 연연하지 않고, 혼자만의 시간을 통해 에너지를 충전하는 실용적인 스타일입니다. 감정에 휘둘리지 않고 객관적인 판단을 잘 내립니다. 하지만 때로는 주변 사람들에게 무관심하거나 차갑다는 오해를 살 수 있으며, 정서적인 교류의 필요성을 간과할 수 있습니다.",
            celebrity: "박명수, 김구라 (타인의 시선보다 자신의 주관을 중요시하고, 감정적인 교류보다 실용적인 관계를 선호하는 유형)",
            advice: {
                "업무/학업": "분석, 연구, 개발 등 개인의 전문성과 독립적인 판단이 중요한 업무에서 높은 성과를 낼 수 있습니다. 팀 프로젝트에서는 감정적인 교류보다는 명확한 역할 분담과 목표 공유를 통해 협력하는 것을 선호합니다.",
                "인간관계": "당신은 불필요한 감정 소모를 줄이고, 실용적인 관계를 유지하는 경향이 있습니다. 하지만 가끔은 의도적으로 주변 사람들에게 관심을 표현하고, 그들의 감정을 물어봐 주는 노력이 필요합니다. '요즘 어떻게 지내?'라는 간단한 질문이 관계의 다리가 될 수 있습니다.",
                "개인 성장": "당신의 독립성은 강점이지만, 때로는 타인의 도움을 청하고 받아들이는 것도 지혜입니다. 모든 것을 혼자 해결하려 하기보다, 신뢰하는 사람에게 자신의 약한 모습을 보여주는 용기는 당신을 더욱 성장시킬 것입니다."
            },
            reflection: [
                "혼자만의 시간을 가질 때, 당신은 주로 무엇을 하며 에너지를 얻나요?",
                "다른 사람들이 감정적으로 호소할 때, 당신은 주로 어떻게 반응하나요?",
                "최근 다른 사람에게 '고맙다' 또는 '미안하다'는 표현을 했던 적이 언제인가요?"
            ]
        },
        subfactors: {
            '정서적 감수성': { high: "타인의 평가와 감정에 매우 민감하게 반응합니다.", low: "감정 표현이 적고, 타인의 반응에 무덤덤한 편입니다." },
            '사회적 애착': { high: "사람들과 깊은 유대감을 형성하고 싶어합니다.", low: "독립적이며, 개인적인 공간과 시간을 중요하게 생각합니다." }
        }
    },
    '인내력 (Persistence)': {
        type: '기질',
        high: {
            title: "성실하고 의지가 강한 마라토너",
            detail: "당신은 한번 목표를 정하면 어려움이 있어도 쉽게 포기하지 않는 강한 의지와 성실함을 가졌습니다. 눈앞의 유혹에 흔들리지 않고, 장기적인 목표를 향해 꾸준히 나아가는 모습은 주변에 큰 신뢰감을 줍니다. 당신의 인내력은 그 어떤 재능보다 강력한 성공의 동력입니다. 하지만 때로는 융통성이 부족하거나, 비효율적인 노력을 고집하여 스스로를 지치게 만들 수도 있습니다.",
            celebrity: "김연아, 박지성 (엄청난 연습과 노력을 통해 최고의 자리에 오른, 목표를 향한 끈기와 의지가 강한 유형)",
            advice: {
                "업무/학업": "장기적인 연구, 전문 기술 습득, 고도의 집중력이 필요한 모든 분야에서 당신의 인내력은 빛을 발합니다. 다만, 너무 완벽하게 하려다 시작조차 못 하는 '완벽주의의 함정'에 빠지지 않도록 주의하세요. '완성'이 '완벽'보다 중요할 때도 있습니다.",
                "인간관계": "당신은 관계에서도 꾸준하고 성실한 모습을 보여줍니다. 하지만 때로는 자신의 높은 기준을 상대방에게도 강요하여 갈등을 유발할 수 있습니다. 사람마다 노력의 방식과 속도가 다름을 인정하는 것이 중요합니다.",
                "개인 성장": "열심히 하는 것만큼이나 '제대로 쉬는 것'도 중요합니다. 의식적으로 휴식 시간을 계획하고, 아무것도 하지 않는 시간을 자신에게 허락해주세요. '포기'가 아니라 '전략적 멈춤'이라고 생각해보세요. 이는 더 멀리 가기 위한 재충전의 시간입니다."
            },
            reflection: [
                "당신의 인내력 덕분에 끝까지 해내서 성취감을 느꼈던 가장 기억에 남는 경험은 무엇인가요?",
                "혹시 너무 한 가지에만 몰두한 나머지, 더 중요하거나 새로운 기회를 놓친 적은 없나요?",
                "당신은 '노력'이 통하지 않는다고 느낄 때, 어떻게 행동하나요?"
            ]
        },
        low: {
            title: "유연하고 다재다능한 탐색가",
            detail: "당신은 다양한 관심사를 가지고 있으며, 한 가지 일에 얽매이기보다 여러 가능성을 탐색하는 것을 즐깁니다. 상황 변화에 유연하게 대처하는 능력이 뛰어나고, 새로운 아이디어를 계속해서 떠올립니다. 하지만 쉽게 지루함을 느껴 일을 마무리 짓는 데 어려움을 겪거나, 꾸준함이 부족하다는 평가를 받을 수 있습니다. 당신의 유연함은 빠르게 변하는 세상에서 큰 장점입니다.",
            celebrity: "신동엽, 탁재훈 (한 가지에 얽매이기보다, 뛰어난 순발력과 유연한 사고로 여러 상황에 대처하는 능력이 탁월한 유형)",
            advice: {
                "업무/학업": "다양한 프로젝트를 동시에 진행하거나, 변화가 잦은 환경, 창의적인 아이디어가 필요한 분야에 잘 맞습니다. 다만, 시작한 일을 마무리하는 습관을 들이는 것이 중요합니다. 'Pomodoro(뽀모도로) 기법'처럼 짧은 시간 집중하고 휴식하는 사이클을 활용해보세요.",
                "인간관계": "다양한 사람들과 쉽게 어울리지만, 관계가 깊어지기 전에 다른 관심사로 옮겨갈 수 있습니다. 당신의 다재다능함을 보여주는 것도 좋지만, 한 사람과 진득하게 대화하며 깊은 속내를 나눠보는 경험도 중요합니다.",
                "개인 성장": "당신의 수많은 관심사 중에서, '이것만큼은 정말 끝을 보고 싶다'고 생각하는 것을 한두 가지만 정해보세요. 그리고 그 목표를 달성하는 과정을 기록해보세요. 작은 성공 경험이 쌓이면, 인내력이 필요한 더 큰 도전도 해낼 수 있는 자신감이 생길 것입니다."
            },
            reflection: [
                "지금까지 당신이 거쳐온 다양한 관심사들의 공통점은 무엇인가요?",
                "어떤 일을 하다가 '아, 지겹다'라는 생각이 들 때, 당신의 다음 행동은 무엇인가요?",
                "당신이 무언가를 꾸준히 하지 못하는 이유가, 정말로 '흥미가 없어서'일까요, 아니면 '어려움에 부딪혀서'일까요?"
            ]
        },
        subfactors: {
            '끈기': { high: "장기적인 노력을 꾸준히 지속하는 힘이 있습니다.", low: "쉽게 포기하거나 다른 관심사로 빠르게 전환합니다." },
            '완벽주의': { high: "높은 기준을 추구하며, 자신을 계속 채찍질합니다.", low: "결과보다 과정을 즐기며, 완벽함에 집착하지 않습니다." }
        }
    },
    '자율성 (Self-Directedness)': {
        type: '성격',
        high: {
            title: "자신을 믿고 나아가는 성숙한 리더",
            detail: "당신은 자신을 믿고, 명확한 가치관과 목표에 따라 삶을 주도적으로 이끌어갑니다. 자신의 선택에 책임을 질 줄 알며, 어려움 속에서도 스스로 길을 찾아 나서는 성숙한 모습을 보입니다. 당신은 어떤 기질을 가졌든 그 기질을 긍정적으로 활용할 힘이 있습니다. 예를 들어, '위험 회피' 기질이 높아도, 당신의 자율성은 그것을 '신중함'이라는 강점으로 승화시킵니다.",
            celebrity: "이효리, 방시혁 (자신만의 뚜렷한 가치관을 가지고, 자신의 삶과 커리어를 주도적으로 만들어나가는 유형)",
            advice: {
                "업무/학업": "목표 설정, 계획, 실행, 평가의 전 과정을 주도적으로 이끌어 나갑니다. 리더의 위치에 있든 아니든, 당신은 주변에 긍정적인 영향력을 미치며 신뢰를 얻습니다.",
                "인간관계": "자신을 존중하는 만큼 타인도 존중하며, 건강하고 성숙한 관계를 맺습니다. 타인에게 의존하거나, 반대로 타인을 지배하려 하지 않고 동등한 관계를 추구합니다.",
                "개인 성장": "이미 훌륭한 방향으로 나아가고 있습니다. 지금처럼 꾸준히 자신을 성찰하고, 더 나은 가치를 향해 나아가는 당신의 모습을 응원합니다. 당신의 경험을 다른 사람들과 나누는 것은 자신과 타인 모두에게 큰 도움이 될 것입니다."
            },
            reflection: [
                "당신이 삶에서 가장 중요하게 생각하는 가치는 무엇이며, 그 가치를 지키기 위해 어떤 노력을 하고 있나요?",
                "스스로 내린 결정 중 가장 자랑스러운 것은 무엇인가요?",
                "10년 후, 당신은 어떤 모습으로 성장해 있기를 바라나요?"
            ]
        },
        low: {
            title: "성장의 가능성을 품은 방랑자",
            detail: "당신은 때로 삶의 방향을 잃고 헤매거나, 중요한 결정을 다른 사람에게 의존하는 경향이 있을 수 있습니다. 자신의 행동에 대해 남이나 상황을 탓하며, 자신에 대한 확신이 부족할 수 있습니다. 이로 인해 타고난 기질의 단점이 더 부각될 수 있습니다. (예: 높은 '자극 추구'가 '산만함'으로) 하지만 이것은 당신이 더 성장할 수 있는 부분이 많다는 의미이기도 합니다.",
            celebrity: "주변의 조언을 중요하게 생각하는 신중한 조력가 타입 (특정 인물보다, 타인과의 조화를 통해 안정감을 느끼고 함께 성장하는 유형)",
            advice: {
                "업무/학업": "명확한 목표와 계획을 세우는 데 어려움을 겪을 수 있습니다. 큰 목표보다는 작고 구체적인 단기 목표부터 세우고 달성하는 연습을 해보세요. '오늘 팔굽혀펴기 1개 하기'처럼 아주 작은 성공이 중요합니다.",
                "인간관계": "타인의 인정이나 의견에 쉽게 흔들려 자신의 주관을 잃기 쉽습니다. 다른 사람의 조언을 듣되, 최종 결정은 스스로 내리는 연습이 필요합니다. '네 의견은 그렇구나, 나는 이렇게 생각해'라고 말해보세요.",
                "개인 성장": "자신을 알아가는 시간을 가져보세요. '나는 무엇을 할 때 즐거운가?', '나는 어떤 사람이 되고 싶은가?' 와 같은 질문을 스스로에게 던지고 일기나 메모로 기록해보세요. 작은 일부터 스스로 선택하고 책임져보는 연습을 통해 당신의 자율성은 반드시 성장할 수 있습니다."
            },
            reflection: [
                "최근 당신의 결정에 가장 큰 영향을 미친 사람은 누구인가요? 그 이유는 무엇인가요?",
                "당신이 어떤 일을 '스스로 해냈다'고 느꼈던 마지막 경험은 언제인가요?",
                "당신은 자신에게 어떤 말을 가장 자주 해주나요? (칭찬, 비난, 격려 등)"
            ]
        },
        subfactors: {
            '책임감': { high: "자신의 선택과 행동에 대해 온전히 책임집니다.", low: "상황이나 다른 사람의 탓으로 돌리는 경향이 있습니다." },
            '목표의식': { high: "목표가 뚜렷하고, 그것을 이루기 위해 실천합니다.", low: "목표를 정하는 데 어려움을 느끼거나, 자주 바뀝니다." },
            '자기수용': { high: "자신의 장점과 단점을 모두 긍정적으로 받아들입니다.", low: "자기 비판적이며, 자신에 대해 불만이 많습니다." }
        }
    },
    '연대감 (Cooperativeness)': {
        type: '성격',
        high: {
            title: "더불어 사는 세상을 만드는 이타주의자",
            detail: "당신은 자신을 사회의 일부로 여기며, 타인을 이해하고 돕는 데서 기쁨을 느낍니다. 다른 사람의 입장을 잘 헤아리고, 공동의 이익을 위해 기꺼이 협력하는 성숙한 모습을 보입니다. 당신은 어떤 공동체에서든 긍정적인 영향을 주는 사람입니다. 당신의 존재는 세상을 더 따뜻하게 만듭니다.",
            celebrity: "션, 유재석 (기부와 봉사를 실천하거나, 팀워크와 배려를 통해 공동체를 이끌어가는 유형)",
            advice: {
                "업무/학업": "팀워크가 중요한 모든 일에서 당신의 능력은 빛을 발합니다. 갈등을 중재하고, 협력적인 분위기를 만들어 프로젝트를 성공으로 이끌니다.",
                "인간관계": "공감과 수용을 바탕으로 안정적이고 신뢰로운 관계를 맺습니다. 당신은 주변 사람들이 믿고 기댈 수 있는 든든한 존재입니다.",
                "개인 성장": "당신의 따뜻함은 큰 힘입니다. 이타적인 마음과 함께, 자신과 타인의 경계를 건강하게 지키는 방법을 익힌다면 더욱 성숙한 관계를 맺을 수 있습니다. 때로는 부당한 요구에 '아니오'라고 말하는 것도 공동체를 위한 용기일 수 있습니다."
            },
            reflection: [
                "당신이 속한 공동체(가족, 회사, 모임 등)를 위해 당신이 기여하고 있는 것은 무엇이라고 생각하나요?",
                "다른 사람을 돕다가 오히려 당신이 지치거나 힘들었던 경험이 있나요?",
                "당신은 어떤 사람에게 가장 큰 '연대감'을 느끼나요?"
            ]
        },
        low: {
            title: "자신의 원칙을 지키는 독립적인 개인",
            detail: "당신은 개인의 권리와 신념을 중요하게 생각하며, 타인과 거리를 두는 것을 편안하게 느낄 수 있습니다. 사회적 관습이나 타인의 의견에 휩쓸리지 않고, 자신만의 기준으로 세상을 판단합니다. 하지만 때로는 타인에게 비판적이거나 이기적으로 비칠 수 있으며, 이로 인해 다른 사람들과 갈등을 겪거나 외로움을 느낄 수 있습니다.",
            celebrity: "고독한 천재 예술가/학자 타입 (타인과의 교류보다 자신의 작업에 몰두하며, 자신만의 세계를 구축하는 데 집중하는 유형)",
            advice: {
                "업무/학업": "독립적인 업무 환경에서 자신의 원칙에 따라 일할 때 높은 효율을 보입니다. 하지만 팀으로 일할 때는, 자신의 방식만을 고집하기보다 팀의 목표를 위해 타협하고 협력하는 자세가 필요합니다.",
                "인간관계": "당신은 소수의 사람과 깊이 있는 관계를 맺거나, 혹은 혼자 있는 것을 선호할 수 있습니다. 나와 다른 사람의 생각이 '틀린' 것이 아니라 '다른' 것임을 이해하려는 노력이 필요합니다. 타인의 입장에서 한번 더 생각해보는 연습을 통해, 당신의 세계는 더욱 넓어질 수 있습니다.",
                "개인 성장": "타인에 대한 불신이나 비판적인 태도는 어디에서 비롯되었는지 스스로 탐색해보세요. 다른 사람의 도움이나 친절을 조건 없이 받아들여보는 작은 시도가, 연대감을 키우는 첫걸음이 될 수 있습니다."
            },
            reflection: [
                "당신이 다른 사람과 '협력하기 어렵다'고 느낄 때는 주로 어떤 상황인가요?",
                "타인의 어떤 행동이 당신을 가장 화나게 하거나 실망하게 만드나요?",
                "당신이 생각하는 '이상적인 사회'는 어떤 모습인가요?"
            ]
        },
        subfactors: {
            '타인수용': { high: "나와 다른 사람의 다양성을 존중하고 포용합니다.", low: "자신의 기준이 중요하며, 타인에게 비판적일 수 있습니다." },
            '공감능력': { high: "타인의 감정을 잘 이해하고, 내 일처럼 공감합니다.", low: "객관적이고 이성적인 판단을 선호하며, 감정적인 교류를 어려워합니다." },
            '이타주의': { high: "공동의 이익을 자신의 이익보다 우선시합니다.", low: "개인의 이익과 권리를 무엇보다 중요하게 생각합니다." }
        }
    },
    '자기초월 (Self-Transcendence)': {
        type: '성격',
        high: {
            title: "세상과 하나되는 지혜로운 영혼",
            detail: "당신은 물질적인 성공이나 개인의 경계를 넘어, 세상 만물과 연결되어 있음을 느낍니다. 자연, 예술, 종교, 우주 등에서 깊은 감동과 일체감을 경험하며, 창의적이고 포용력이 넓습니다. 자신을 더 큰 전체의 일부로 여길 줄 아는 지혜를 가졌습니다. 이러한 특성은 당신에게 깊은 통찰력과 영감을 줍니다.",
            celebrity: "이어령, 류이치 사카모토 (자신의 분야를 넘어, 세상의 근원과 영적인 가치를 탐구하며 깊은 통찰을 보여준 유형)",
            advice: {
                "업무/학업": "예술, 철학, 종교, 기초 과학 등 근원적인 질문을 탐구하는 분야나, 새로운 가치를 창조하는 일에서 큰 잠재력을 발휘합니다. 당신의 넓은 시야는 다른 사람들이 보지 못하는 가능성을 발견하게 합니다.",
                "인간관계": "사람을 조건 없이 수용하고, 그 사람의 본질을 꿰뚫어 보는 능력이 있습니다. 사람들을 영적인 차원에서 이해하고 깊은 유대감을 형성합니다.",
                "개인 성장": "당신의 넓은 시야와 포용력은 세상에 꼭 필요한 가치입니다. 당신이 느끼는 영감을 현실에서 창의적으로 표현하고 다른 사람들과 나눌 때, 그 가치는 더욱 빛날 것입니다. 다만, 때로는 현실적인 문제들을 처리하는 데 어려움을 느낄 수 있으니, 구체적인 계획과 실천을 도와줄 조력자를 곁에 두는 것도 좋습니다."
            },
            reflection: [
                "최근 당신에게 가장 큰 영감이나 감동을 준 것은 무엇이었나요?",
                "당신이 '살아있음'을 가장 강렬하게 느끼는 순간은 언제인가요?",
                "당신이 생각하기에, '성공적인 삶'이란 무엇인가요?"
            ]
        },
        low: {
            title: "현실에 발 딛고 선 실용주의자",
            detail: "당신은 눈에 보이고 손에 잡히는 현실적인 것을 중요하게 생각합니다. 과학적이고 논리적인 사고를 선호하며, 추상적이거나 영적인 개념에는 큰 흥미를 느끼지 않을 수 있습니다. 목표 지향적이고 실용적인 삶을 살아가며, '지금 여기'에 집중합니다. 당신의 현실 감각은 매우 안정적이고 신뢰할 수 있는 강점입니다.",
            celebrity: "백종원 (추상적인 가치보다, 현실적이고 실용적인 해결책을 통해 구체적인 결과물을 만들어내는 데 집중하는 유형)",
            advice: {
                "업무/학업": "구체적인 목표를 설정하고, 효율적인 방법으로 달성해나가는 모든 일에 강합니다. 경영, 공학, 행정 등 실용적인 결과물을 만들어내는 분야에서 능력을 발휘합니다.",
                "인간관계": "현실적인 조언과 실질적인 도움을 통해 관계에 기여합니다. 감정적인 위로보다는 문제 해결에 초점을 맞추는 경향이 있습니다.",
                "개인 성장": "현실 감각은 당신의 큰 강점입니다. 가끔은 효율과 논리에서 벗어나, 이유 없이 하늘을 보거나 음악을 듣는 것처럼 비생산적인 활동을 즐겨보는 건 어떨까요? 당장의 쓸모는 없더라도, 이러한 경험들이 당신의 삶을 더욱 풍요롭게 만들고 새로운 관점을 열어줄 수 있습니다."
            },
            reflection: [
                "당신이 어떤 문제를 해결할 때, 가장 먼저 고려하는 것은 무엇인가요?",
                "당신에게 '뜬구름 잡는 소리'처럼 들리는 이야기는 주로 어떤 것들인가요?",
                "당신이 세운 가장 장기적인 계획은 무엇이며, 그것을 어떻게 실천하고 있나요?"
            ]
        },
        subfactors: {
            '창조적 자기망각': { high: "예술, 자연, 상상에 깊이 몰입하며 시간을 잊습니다.", low: "현실적이고 구체적인 활동을 선호합니다." },
            '우주만물과의 일체감': { high: "영적이고 초월적인 경험에 개방적입니다.", low: "과학적이고 논리적인 설명을 선호합니다." }
        }
    }
};

// Helper to get total number of questions
const getTotalQuestions = () => {
  let count = 0;
  Object.values(questions).forEach(group => {
    Object.values(group.subfactors).forEach(subfactorQuestions => {
      count += subfactorQuestions.length;
    });
  });
  return count;
};

const totalQuestionCount = getTotalQuestions();

export default function TciTestPage() {
  const [answers, setAnswers] = useState<{ [key: string]: number }>({});
  const [showResults, setShowResults] = useState(false);
  const [activeResultTab, setActiveResultTab] = useState<'temperament' | 'character'>('temperament');
  const { toast } = useToast();

  const handleAnswerChange = (questionId: string, value: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const calculateScores = useCallback(() => {
    let scores: { [key: string]: { totalScore: number; subfactors: { [key: string]: number } } } = {};

    Object.keys(questions).forEach((group, groupIndex) => {
      scores[group] = { totalScore: 0, subfactors: {} };
      const subfactors = questions[group].subfactors;
      Object.keys(subfactors).forEach((subfactorName, subfactorIndex) => {
        let subfactorScore = 0;
        subfactors[subfactorName].forEach((q, qIndex) => {
          const questionId = `q-${groupIndex}-${subfactorIndex}-${qIndex}`;
          if (answers[questionId]) {
            subfactorScore += answers[questionId];
          }
        });
        scores[group].subfactors[subfactorName] = subfactorScore;
        scores[group].totalScore += subfactorScore;
      });
    });
    return scores;
  }, [answers]);

  const handleSubmit = () => {
    if (Object.keys(answers).length < totalQuestionCount) {
      toast({
        title: "잠시만요!",
        description: "모든 질문에 답변을 완료해주세요.",
        variant: "destructive",
      });
      return;
    }
    setShowResults(true);
  };

  const renderQuestionForm = () => (
    <form id="tci-form">
      {Object.keys(questions).map((group, groupIndex) => (
        <div key={groupIndex} className="mb-8 p-6 bg-white rounded-xl shadow-md">
          <h3 className="text-xl font-bold mb-4 p-3 rounded-lg text-white bg-gradient-to-r from-indigo-400 to-purple-400">
            {group}
          </h3>
          {Object.keys(questions[group].subfactors).map((subfactorName, subfactorIndex) => (
            <div key={`${groupIndex}-${subfactorIndex}`} className="p-4 border border-gray-200 rounded-lg mb-4">
              <h4 className="text-md font-semibold mb-3 p-2 rounded bg-indigo-50 text-indigo-700">
                {subfactorName}
              </h4>
              {questions[group].subfactors[subfactorName].map((q, qIndex) => {
                const questionId = `q-${groupIndex}-${subfactorIndex}-${qIndex}`;
                return (
                  <div key={questionId} className="mb-4 p-2 rounded-lg hover:bg-gray-50">
                    <p className="font-medium mb-2 text-gray-700">{q}</p>
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span>전혀<br />아니다</span>
                      {[1, 2, 3, 4, 5].map(val => (
                        <label key={val} className="flex flex-col items-center cursor-pointer">
                          <input
                            type="radio"
                            name={questionId}
                            value={val}
                            onChange={() => handleAnswerChange(questionId, val)}
                            checked={answers[questionId] === val}
                            className="form-radio h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                            required
                          />
                          <span className="mt-1">{val}</span>
                        </label>
                      ))}
                      <span>매우<br />그렇다</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ))}
    </form>
  );

  const renderResults = () => {
    const scores = calculateScores();
    const resultCards: { temperament: JSX.Element[]; character: JSX.Element[] } = {
      temperament: [],
      character: [],
    };

    Object.keys(scores).forEach(group => {
      const groupData = questions[group];
      const groupScores = scores[group];
      const totalQuestionsInGroup = Object.values(groupData.subfactors).reduce((acc, val) => acc + val.length, 0);
      const maxScore = totalQuestionsInGroup * 5;
      const totalScore = groupScores.totalScore;
      const scoreOutOf100 = Math.round(((totalScore - totalQuestionsInGroup) / (maxScore - totalQuestionsInGroup)) * 100);
      
      const highLowThreshold = totalQuestionsInGroup * 3; // Midpoint for 1-5 scale (average 3)
      const overallInterpretationData = totalScore >= highLowThreshold ? interpretations[group].high : interpretations[group].low;

      let subfactorHTML: JSX.Element[] = [];
      Object.keys(groupScores.subfactors).forEach(subfactorName => {
          const subfactorScore = groupScores.subfactors[subfactorName];
          const subfactorMaxScore = groupData.subfactors[subfactorName].length * 5;
          const subfactorPercentage = (subfactorScore / subfactorMaxScore) * 100;
          const subfactorHighLowThreshold = groupData.subfactors[subfactorName].length * 3; // Midpoint for 1-5 scale
          const subfactorInterpretation = interpretations[group].subfactors[subfactorName][subfactorScore >= subfactorHighLowThreshold ? 'high' : 'low'];

          subfactorHTML.push(
              <div key={subfactorName} className="py-3 px-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-700">{subfactorName}</span>
                      <span className="text-sm font-bold text-indigo-600">{subfactorScore} / {subfactorMaxScore}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 my-1">
                      <div className="bg-indigo-400 h-2 rounded-full" style={{ width: `${subfactorPercentage}%` }}></div>
                  </div>
                  <p className="text-xs text-gray-500">{subfactorInterpretation}</p>
              </div>
          );
      });
      
      let adviceHTML: JSX.Element[] = [];
      Object.keys(overallInterpretationData.advice).forEach(category => {
          adviceHTML.push(
              <p key={category} className="text-xs mb-2">
                  <strong className="font-semibold text-gray-700">{category}:</strong> {overallInterpretationData.advice[category]}
              </p>
          );
      });

      let reflectionHTML: JSX.Element[] = [];
      overallInterpretationData.reflection.forEach((q, i) => {
          reflectionHTML.push(<li key={i} className="text-xs">{q}</li>);
      });

      let celebrityHTML: JSX.Element[] = [];
      const celebrityNames = overallInterpretationData.celebrity.split(',').map(name => name.trim());
      celebrityNames.forEach((name, i) => {
          const encodedName = encodeURIComponent(name);
          celebrityHTML.push(
              <div key={i} className="flex items-center space-x-2">
                  <img src={`https://placehold.co/40x40/fdf2f8/831843?text=${encodedName}`} className="w-10 h-10 rounded-full object-cover" alt={`${name} 이미지`} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src='https://placehold.co/40x40/e0e0e0/000000?text=?'; }} />
                  <span className="text-sm font-medium">{name}</span>
              </div>
          );
      });

      const resultCard = (
          <div key={group} className="result-card border border-gray-200 rounded-xl shadow-lg overflow-hidden">
              <button
                  className="accordion-button w-full p-4 text-left bg-white hover:bg-gray-50 transition"
                  onClick={(e) => {
                      const button = e.currentTarget;
                      const content = button.nextElementSibling as HTMLElement;
                      const isExpanded = button.getAttribute('aria-expanded') === 'true';
                      button.setAttribute('aria-expanded', String(!isExpanded));
                      if (!isExpanded) {
                          content.style.maxHeight = content.scrollHeight + 'px';
                      } else {
                          content.style.maxHeight = '0px';
                      }
                  }}
                  aria-expanded="false"
              >
                  <div className="flex justify-between items-center">
                      <div>
                          <span className={cn(
                              "text-xs font-semibold px-2 py-1 rounded-full",
                              interpretations[group].type === '기질' ? 'text-blue-500 bg-blue-100' : 'text-green-500 bg-green-100'
                          )}>
                              {interpretations[group].type}
                          </span>
                          <h4 className="font-bold text-lg text-indigo-700 mt-1">{group}</h4>
                      </div>
                      <div className="text-right">
                          <span className="font-extrabold text-2xl text-indigo-800">{scoreOutOf100}</span>
                          <span className="text-sm text-gray-500">점</span>
                          <svg className="accordion-arrow w-6 h-6 text-gray-500 transition-transform duration-300 inline-block ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                  </div>
                   <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                      <div className="bg-gradient-to-r from-purple-400 to-indigo-500 h-2.5 rounded-full" style={{ width: `${scoreOutOf100}%` }}></div>
                  </div>
              </button>
              <div className="accordion-content bg-gray-50">
                  <div className="p-4 border-b border-gray-200">
                      <h5 className="font-bold text-md mb-2 text-gray-800">"{overallInterpretationData.title}"</h5>
                      <p className="text-sm text-gray-600 mb-4">{overallInterpretationData.detail}</p>
                      <div className="p-4 rounded-lg celebrity-box mb-4">
                           <p className="text-sm font-semibold mb-2">⭐ 비슷한 유형의 유명인</p>
                           <div className="flex items-center flex-wrap gap-4">{celebrityHTML}</div>
                      </div>
                      <div className="p-4 rounded-lg tip-box mb-4">
                          <p className="text-sm font-semibold mb-2"> 성장을 위한 제언</p>
                          {adviceHTML}
                      </div>
                      <div className="p-4 rounded-lg reflection-box">
                          <p className="text-sm font-semibold mb-2"> 자기 성찰 질문</p>
                          <ul className="list-disc list-inside space-y-1">{reflectionHTML}</ul>
                      </div>
                  </div>
                  <div className="p-4">
                      <h5 className="font-bold text-sm text-gray-600 mb-2">세부 요인 분석</h5>
                      {subfactorHTML}
                  </div>
              </div>
          </div>
      );
      
      if (interpretations[group].type === '기질') {
          resultCards.temperament.push(resultCard);
      } else {
          resultCards.character.push(resultCard);
      }
    });

    return (
      <div id="results">
        <div id="temperament-page" className={cn("space-y-4", activeResultTab !== 'temperament' && 'hidden')}>
          {resultCards.temperament}
        </div>
        <div id="character-page" className={cn("space-y-4", activeResultTab !== 'character' && 'hidden')}>
          {resultCards.character}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-4xl">
      <header className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-indigo-600 mb-2">TCI 심화 자가 테스트</h1>
        <p className="text-md text-gray-600">나의 기질과 성격을 상세하게 알아보기</p>
      </header>

      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-8 rounded-lg shadow-md" role="alert">
        <p className="font-bold">주의사항</p>
        <p>본 테스트는 자기 이해를 위한 참고 자료일 뿐, 전문적인 심리 검사를 대체할 수 없습니다. 재미로만 즐겨주세요!</p>
      </div>

      {!showResults ? (
        <>
          {renderQuestionForm()}
          <div className="text-center mt-8">
            <Button onClick={handleSubmit} className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-full hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition-all duration-300 transform hover:scale-105 shadow-lg">
              결과 확인하기
            </Button>
          </div>
        </>
      ) : (
        <div id="result-container" className="mt-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 text-indigo-600">나의 기질 & 성격 분석 결과</h2>
          
          <div className="bg-white p-6 rounded-xl shadow-md mb-6">
              <h3 className="text-xl font-bold text-indigo-700 mb-3">결과를 읽기 전에</h3>
              <p className="text-gray-700 mb-2"><strong className="text-blue-600">기질 (Temperament)</strong>은 타고난 정서적 반응 패턴입니다. '자극 추구', '위험 회피', '사회적 민감성', '인내력'이 여기에 해당합니다. 이것은 좋고 나쁨이 없는, 나 고유의 특성입니다. '바꾸려' 하기보다 '이해하고 활용'하는 지혜가 필요합니다.</p>
              <p className="text-gray-700"><strong className="text-green-600">성격 (Character)</strong>은 후천적으로 발달하는 가치관과 삶의 태도입니다. '자율성', '연대감', '자기초월'이 여기에 해당합니다. 이것은 의식적인 노력을 통해 '성숙'시키고 '발전'시킬 수 있는 영역입니다.</p>
          </div>

          <div id="pagination-controls" className="flex justify-center my-6">
              <button
                id="temperament-btn"
                onClick={() => setActiveResultTab('temperament')}
                className={cn("pagination-btn font-semibold py-2 px-6 rounded-l-lg", activeResultTab === 'temperament' && 'active')}
              >
                기질 결과
              </button>
              <button
                id="character-btn"
                onClick={() => setActiveResultTab('character')}
                className={cn("pagination-btn font-semibold py-2 px-6 rounded-r-lg", activeResultTab === 'character' && 'active')}
              >
                성격 결과
              </button>
          </div>

          {renderResults()}

           <div className="mt-8 text-center bg-gray-200 p-6 rounded-lg">
              <h3 className="font-bold text-lg mb-2">마치며</h3>
              <p className="text-sm text-gray-700">이 결과는 당신을 규정하는 '정답'이 아니라, 당신 자신을 더 깊이 이해하기 위한 '질문'입니다. 어떤 기질이 높고 낮은지, 그리고 성격적 성숙도가 어떻게 상호작용하는지 생각해 보세요. 예를 들어, '자극 추구'가 높으면서 '자율성'도 높다면, 그 에너지를 목표 달성에 효과적으로 사용할 수 있을 것입니다. 자신만의 사용 설명서를 만들어가는 즐거운 여정이 되기를 바랍니다.</p>
          </div>
        </div>
      )}
    </div>
  );
}
