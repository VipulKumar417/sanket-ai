import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getNextKey, markKeyExhausted, availableKeyCount, TOTAL_KEYS } from '@/lib/keyRotation';

const MODEL = 'gemini-2.5-flash-lite';

function buildPrompt(input: string, persona: string): string {
  return `
You are the intelligence engine for Sanket AI, a decision intelligence platform.
Analyze the following news event or article content.

News/Event Input:
"""
${input}
"""

Target Persona: ${persona}

Return your analysis STRICTLY as a valid JSON object. Do NOT include markdown code fences, backticks, or any text outside the JSON.

Schema to follow exactly:
{
  "category": "1-2 word string (e.g. Geopolitics, Natural Disaster, Tech Regulation, Finance, Election)",
  "summary": "1-2 sentence concise summary of the event",
  "immediate_impacts": ["impact 1", "impact 2", "impact 3"],
  "secondary_impacts": ["effect 1", "effect 2", "effect 3"],
  "risk_score": "Low",
  "recommended_actions": ["action 1", "action 2", "action 3"]
}

For risk_score, choose exactly one of: "Low", "Medium", or "High" — based on severity for the ${persona} persona.
All arrays must have exactly 3 items.
`;
}

export async function POST(request: Request) {
  try {
    const { input, persona } = await request.json();

    if (!input || !persona) {
      return NextResponse.json({ error: 'Input and persona are required' }, { status: 400 });
    }

    if (TOTAL_KEYS === 0) {
      return NextResponse.json(
        { error: 'No Gemini API keys configured. Add GEMINI_API_KEY_1 … to .env.local' },
        { status: 500 }
      );
    }

    const prompt = buildPrompt(input, persona);
    const maxAttempts = Math.min(TOTAL_KEYS, 29); // try every key at most once per request

    let lastError = '';

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      let currentKey = '';
      try {
        currentKey = getNextKey();
      } catch (e: any) {
        // All keys exhausted right now
        return NextResponse.json({ error: e.message }, { status: 429 });
      }

      try {
        const ai = new GoogleGenAI({ apiKey: currentKey });

        const response = await ai.models.generateContent({
          model: MODEL,
          contents: prompt,
          config: {
            temperature: 0.2,
            responseMimeType: 'application/json',
          },
        });

        const resultText = response.text ?? '{}';

        // Sanitize: strip any accidental markdown fences
        const cleaned = resultText
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/```\s*$/i, '')
          .trim();

        const resultJson = JSON.parse(cleaned);

        console.log(
          `[Analyze] Success with key …${currentKey.slice(-6)} ` +
          `(${availableKeyCount()}/${TOTAL_KEYS} keys healthy)`
        );

        return NextResponse.json(resultJson);

      } catch (error: any) {
        const errStr = JSON.stringify(error?.message ?? error);
        const is429 =
          error?.status === 429 ||
          errStr.includes('429') ||
          errStr.includes('RESOURCE_EXHAUSTED') ||
          errStr.includes('quota');

        if (is429) {
          // Parse retry-after from the error if present
          const retryMatch = errStr.match(/retry[^0-9]*(\d+)/i);
          const retryAfterSec = retryMatch ? parseInt(retryMatch[1], 10) + 5 : 65;

          markKeyExhausted(currentKey, retryAfterSec);
          lastError = `Key …${currentKey.slice(-6)} exhausted (429). Trying next key…`;
          // Loop continues — next iteration picks a fresh key automatically
          continue;
        }

        // Non-quota error (auth, network, etc.) — fail immediately
        console.error(`[Analyze] Non-quota error:`, error?.message ?? error);
        return NextResponse.json(
          { error: `Analysis failed: ${error?.message ?? 'Unknown error'}` },
          { status: 500 }
        );
      }
    }

    // Exhausted all retries
    return NextResponse.json(
      { error: `All API keys are rate-limited. ${lastError}` },
      { status: 429 }
    );

  } catch (error: any) {
    console.error('[Analyze] Unexpected error:', error?.message ?? error);
    return NextResponse.json(
      { error: `Server error: ${error?.message ?? 'Unknown'}` },
      { status: 500 }
    );
  }
}
