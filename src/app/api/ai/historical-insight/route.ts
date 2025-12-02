import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { buildHistoricalPrompt, SYSTEM_PROMPT } from '@/lib/prompts';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      console.error('OpenAI API Key is missing. Environment variables:', {
        hasKey: !!process.env.OPENAI_API_KEY,
        keyLength: process.env.OPENAI_API_KEY?.length || 0,
        allEnvKeys: Object.keys(process.env).filter(key => key.includes('OPENAI') || key.includes('AI')),
      });
      return NextResponse.json(
        { error: 'OpenAI API Key가 설정되지 않았습니다. Vercel 환경 변수에서 OPENAI_API_KEY를 확인해주세요.' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { brand, brandKo, pnlData } = body;

    if (!brand || !pnlData) {
      return NextResponse.json(
        { error: '유효하지 않은 요청입니다.' },
        { status: 400 }
      );
    }

    const client = new OpenAI({ apiKey });
    const prompt = buildHistoricalPrompt({ brand, brandKo, pnlData });

    console.log('Calling OpenAI API...', { model: 'gpt-4o-mini', promptLength: prompt.length });

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const insight = completion.choices[0]?.message?.content ?? '';

    if (!insight) {
      console.warn('OpenAI returned empty insight');
    }

    return NextResponse.json({ insight });
  } catch (error) {
    console.error('AI Insight Error:', error);
    
    // 더 자세한 에러 정보 로깅
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
    }

    // OpenAI API 에러인 경우 더 자세한 정보 제공
    if (error && typeof error === 'object' && 'response' in error) {
      const openaiError = error as any;
      console.error('OpenAI API Error:', {
        status: openaiError.response?.status,
        statusText: openaiError.response?.statusText,
        data: openaiError.response?.data,
      });
    }

    const message =
      error instanceof Error 
        ? error.message 
        : '알 수 없는 오류가 발생했습니다.';

    return NextResponse.json(
      { 
        error: message,
        details: error instanceof Error ? error.stack : undefined,
      }, 
      { status: 500 }
    );
  }
}



