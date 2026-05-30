CREATE TABLE IF NOT EXISTS "creation_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL,
  "source_id" uuid,
  "article_id" uuid,
  "selected_angles" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "selected_channel_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "drafts" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "status" text DEFAULT 'ready' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
