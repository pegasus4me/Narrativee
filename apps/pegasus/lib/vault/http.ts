import { NextResponse } from "next/server";
import { z } from "zod";

export class VaultError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

export function checkOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) throw new VaultError("Origine refusée.", 403);
}

export async function readBody(request: Request, maxBytes = 3000000) {
  if (!request.headers.get("content-type")?.includes("application/json")) throw new VaultError("JSON requis.", 415);
  const reader = request.body?.getReader();
  if (!reader) throw new VaultError("Corps manquant.");
  const parts: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > maxBytes) { await reader.cancel(); throw new VaultError("Contenu trop volumineux.", 413); }
    parts.push(value);
  }
  try { return JSON.parse(Buffer.concat(parts).toString("utf8")) as unknown; }
  catch { throw new VaultError("JSON invalide."); }
}

export function json(value: unknown, status = 200) {
  return NextResponse.json(value, { status, headers: { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow" } });
}

export function failure(error: unknown) {
  if (error instanceof VaultError) return json({ error: error.message }, error.status);
  if (error instanceof z.ZodError) return json({ error: error.issues[0]?.message ?? "Données invalides." }, 400);
  console.error("Vault request failed", error instanceof Error ? error.name : "UnknownError");
  return json({ error: "Service momentanément indisponible. Votre saisie peut être réessayée." }, 503);
}
