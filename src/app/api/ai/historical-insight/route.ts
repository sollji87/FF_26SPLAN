import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { buildHistoricalPrompt, SYSTEM_PROMPT } from '@/lib/prompts';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API Key가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { brand, brandKo, seasons } = body;

    if (!brand || !seasons || !Array.isArray(seasons)) {
      return NextResponse.json(
        { error: '유효하지 않은 요청입니다.' },
        { status: 400 }
      );
    }

    const client = new OpenAI({ apiKey });
    const prompt = buildHistoricalPrompt({ brand, brandKo, seasons });

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

    return NextResponse.json({ insight });
  } catch (error) {
    console.error('AI Insight Error:', error);

    const message =
      error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}



