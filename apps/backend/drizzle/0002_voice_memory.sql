ALTER TABLE "knowledge_base"
ADD COLUMN "voice_memory" jsonb DEFAULT '{}'::jsonb NOT NULL;
