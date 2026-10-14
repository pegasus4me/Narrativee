import { z } from "zod";
import { requireSession } from "../../../../../lib/vault/auth";
import { getProject, saveProject } from "../../../../../lib/vault/db";
import { checkOrigin, failure, json, readBody } from "../../../../../lib/vault/http";
import { dataSchema } from "../../../../../lib/vault/model";

type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, context: Context) {
  try {
    await requireSession();
    return json(await getProject(z.uuid().parse((await context.params).id)));
  } catch (error) { return failure(error); }
}
export async function PATCH(request: Request, context: Context) {
  try {
    checkOrigin(request);
    await requireSession();
    const id = z.uuid().parse((await context.params).id);
    const body = z.object({ revision: z.number().int().positive(), data: dataSchema }).parse(await readBody(request));
    return json(await saveProject(id, body.revision, body.data));
  } catch (error) { return failure(error); }
}
