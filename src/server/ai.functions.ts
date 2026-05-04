import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  question: z.string().min(1).max(2000),
  options: z.array(z.string().min(1).max(500)).min(2).max(8),
  type: z.string().min(1).max(50),
});

const toolSchema = {
  type: "function" as const,
  function: {
    name: "submit_decision",
    description: "Submit your chosen answer with reasoning and confidence.",
    parameters: {
      type: "object",
      properties: {
        answer: { type: "string", description: "Must exactly match one of the provided options." },
        reasoning: { type: "string", description: "Brief explanation (1-3 sentences)." },
        confidence: { type: "number", description: "Confidence 0-100." },
      },
      required: ["answer", "reasoning", "confidence"],
      additionalProperties: false,
    },
  },
};

export const getAiDecision = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => inputSchema.parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { error: "AI gateway not configured", answer: null, reasoning: null, confidence: null };
    }

    const systemPrompt = `You are an analytical decision-maker participating in a benchmark against human reasoning. For each ${data.type} question, choose exactly one of the provided options that you believe is correct/best. Respond ONLY by calling the submit_decision tool. The answer field MUST be one of the provided options verbatim.`;
    const userPrompt = `Question: ${data.question}\n\nOptions:\n${data.options.map((o, i) => `${i + 1}. ${o}`).join("\n")}`;

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          tools: [toolSchema],
          tool_choice: { type: "function", function: { name: "submit_decision" } },
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("AI gateway error:", res.status, text);
        if (res.status === 429) return { error: "AI is rate limited. Try again shortly.", answer: null, reasoning: null, confidence: null };
        if (res.status === 402) return { error: "AI credits exhausted. Add funds to continue.", answer: null, reasoning: null, confidence: null };
        return { error: "AI request failed", answer: null, reasoning: null, confidence: null };
      }

      const json = await res.json();
      const tc = json.choices?.[0]?.message?.tool_calls?.[0];
      if (!tc) {
        return { error: "AI returned no decision", answer: null, reasoning: null, confidence: null };
      }
      const args = JSON.parse(tc.function.arguments);
      // Normalize answer to closest option
      const matched = data.options.find((o) => o.toLowerCase().trim() === String(args.answer).toLowerCase().trim()) ?? args.answer;
      return {
        error: null,
        answer: String(matched),
        reasoning: String(args.reasoning ?? ""),
        confidence: Math.max(0, Math.min(100, Math.round(Number(args.confidence) ?? 50))),
      };
    } catch (e) {
      console.error("AI call failed:", e);
      return { error: "AI service unavailable", answer: null, reasoning: null, confidence: null };
    }
  });
