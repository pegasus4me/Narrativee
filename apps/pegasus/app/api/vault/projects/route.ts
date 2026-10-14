import { z } from "zod";
import { requireSession } from "../../../../lib/vault/auth";
import { database } from "../../../../lib/vault/db";
import { checkOrigin, failure, json, readBody } from "../../../../lib/vault/http";
import { newProject, ownerEmail, type Project } from "../../../../lib/vault/model";

export async function GET() {
  try {
    await requireSession();
    const result = await database().query<Project>("select id, revision, data from pegasus_vault.projects where owner_email=$1 order by created_at", [ownerEmail]);
    return json(result.rows);
  } catch (error) { return failure(error); }
}

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    await requireSession();
    const { name } = z.object({ name: z.string().trim().min(1).max(100) }).parse(await readBody(request, 1000));
    const result = await database().query<Project>("insert into pegasus_vault.projects(owner_email,data) values($1,$2) returning id, revision, data", [ownerEmail, JSON.stringify(newProject(name))]);
    return json(result.rows[0], 201);
  } catch (error) { return failure(error); }
}
