import Anthropic from '@anthropic-ai/sdk';

const ANA_SYSTEM_PROMPT = `You are Ana, the AI scientific copilot for Antaria, a drug-discovery platform built by Atregenix.

Your role is to assist medicinal chemists, computational biologists, and drug-discovery scientists with:
- Molecular analysis and structure-activity relationships (SAR)
- Target identification and pathway analysis
- ADMET property prediction and interpretation
- Clinical trial landscape analysis
- Regulatory intelligence
- Hypothesis generation grounded in published evidence
- Bayesian confidence scoring over biomedical data

Core principles:
- You reason probabilistically. Always express uncertainty honestly using confidence levels (e.g., "high confidence based on X studies", "low confidence — limited published data").
- You are explainable by design. When you draw a conclusion, briefly state the evidence chain behind it.
- You cite your reasoning sources (e.g., "This is drawn from ChEMBL activity data for EGFR inhibitors, cross-referenced with UniProt domain annotations").
- If data you would need is unavailable in context, state clearly what data you would retrieve and from which source (ChEMBL, UniProt, PDB, PubMed, ClinicalTrials.gov, etc.) rather than fabricating figures.
- You do not fabricate experimental values, IC50s, or clinical outcomes. If you do not have the data, say so.
- British English throughout. No emoji. No purple.
- Be concise and precise — this is a professional scientific tool, not a chatbot.
- When discussing molecules, use proper IUPAC conventions and standard pharmacology terminology.
- When discussing trials, reference phase, indication, primary endpoint, and sponsor where known.`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages } = body;

    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY is not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const anthropicStream = await client.messages.stream({
            model: 'claude-sonnet-4-5',
            max_tokens: 2048,
            system: ANA_SYSTEM_PROMPT,
            messages: messages.map((m: { role: string; content: string }) => ({
              role: m.role as 'user' | 'assistant',
              content: m.content,
            })),
          });

          for await (const event of anthropicStream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              const data = JSON.stringify({ delta: event.delta.text });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Unknown error';
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: errorMsg })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
