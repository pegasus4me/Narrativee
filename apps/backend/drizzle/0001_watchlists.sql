CREATE TABLE IF NOT EXISTS "watchlists" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "watchlist_members" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "watchlist_id" uuid NOT NULL REFERENCES "watchlists"("id") ON DELETE CASCADE,
  "handle" text NOT NULL,
  "name" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);
