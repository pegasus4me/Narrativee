import { getGrokClient } from "../../config/xai";

export type JsonObject = Record<string, unknown>;

export async function grokJson<T extends JsonObject>(params: {
  systemPrompt: string;
  userPayload: JsonObject;
  model?: string;
}): Promise<T | null> {
  const grok = getGrokClient();
  if (!grok) return null;

  const response = await grok.chat.completions.create({
    model: params.model ?? "grok-4.3",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: params.systemPrompt },
      { role: "user", content: JSON.stringify(params.userPayload) },
    ],
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function hasGrok(): boolean {
  return Boolean(getGrokClient());
}
