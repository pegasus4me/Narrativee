CREATE TABLE IF NOT EXISTS "site_analysis" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text,
  "url" text NOT NULL,
  "status" text DEFAULT 'queued' NOT NULL,
  "progress" integer DEFAULT 0 NOT NULL,
  "raw_document" jsonb,
  "diagnosis" jsonb,
  "error" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "site_analysis_user_id_user_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."user"("id")
    ON DELETE SET NULL
);
