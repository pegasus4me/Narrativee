import { z } from "zod";
import { requireSession } from "../../../../../../lib/vault/auth";
import { getProject } from "../../../../../../lib/vault/db";
import { failure } from "../../../../../../lib/vault/http";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireSession();
    const project = await getProject(z.uuid().parse((await context.params).id));
    return new Response(JSON.stringify({ exportedAt: new Date().toISOString(), ...project }, null, 2), { headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="journal-${project.id}.json"`, "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow" } });
  } catch (error) { return failure(error); }
}
