// app/api/gemini-insight/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { stockCode, companyName } = await req.json();

    if (!stockCode || !companyName) {
      return NextResponse.json({ success: false, error: 'Stock code and company name are required.' }, { status: 400 });
    }

    // --- Gemini API Call Placeholder ---
    // IMPORTANT: Replace this with your actual Gemini API integration.
    // You will need to install the Google Generative AI SDK: npm install @google/generative-ai
    // And set up your API key: process.env.GEMINI_API_KEY
    
    // Example using @google/generative-ai (uncomment and fill in your logic)
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"}); // Or "gemini-1.5-flash", etc.

    const prompt = `Analyze the investment momentum for ${companyName} (${stockCode}) for 2025. Provide a concise summary of key bullish and bearish factors, and potential growth areas. Focus on 2025 outlook. Provide the analysis in Korean.`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    let geminiInsight = text;

    // Placeholder response for now (commented out)
    // const geminiInsight = `[Gemini Placeholder Insight for ${companyName} (${stockCode})]: 2025년 ${companyName}의 투자 모멘텀은 AI 반도체 수요 증가와 신규 사업 확장에 힘입어 긍정적입니다. 다만, 글로벌 경기 둔화와 경쟁 심화는 하방 리스크로 작용할 수 있습니다.`;
    // --- End Gemini API Call Placeholder ---

    return NextResponse.json({ success: true, insight: geminiInsight });

  } catch (error) {
    console.error('Error in Gemini insight API route:', error);
    return NextResponse.json({ success: false, error: 'Internal server error.' }, { status: 500 });
  }
}