// app/api/gemini-insight/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { stockCode, companyName } = await req.json();

    if (!stockCode || !companyName) {
      return NextResponse.json({ success: false, error: 'Stock code and company name are required.' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ success: false, error: 'Gemini API key is not configured.' }, { status: 500 });
    }

    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Analyze the investment momentum for ${companyName} (${stockCode}) for 2025. Provide a concise summary of key bullish and bearish factors, and potential growth areas. Focus on 2025 outlook. Provide the analysis in Korean.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const geminiInsight = text;

    return NextResponse.json({ success: true, insight: geminiInsight });

  } catch (error) {
    console.error('Error in Gemini insight API route:', error);
    return NextResponse.json({ success: false, error: 'Internal server error.' }, { status: 500 });
  }
}