import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "../auth-schema";

const sql = neon(process.env.DATABASE_URL || "postgresql://postgres:Rayan_2008@db.nwqzqzzgrbdergqehnso.supabase.co:6543/postgres");

export const db = drizzle(sql, { schema });
