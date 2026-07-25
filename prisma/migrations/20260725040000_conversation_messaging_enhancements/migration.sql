-- Campos de actividad y lectura en conversaciones
ALTER TABLE "conversations"
  ADD COLUMN "last_message_at" TIMESTAMP(3),
  ADD COLUMN "last_message_body" TEXT,
  ADD COLUMN "last_message_sender_id" UUID,
  ADD COLUMN "donor_last_read_at" TIMESTAMP(3),
  ADD COLUMN "foundation_last_read_at" TIMESTAMP(3);

CREATE INDEX "conversations_last_message_at_idx" ON "conversations"("last_message_at");

-- Backfill desde ultimo mensaje existente
UPDATE "conversations" c
SET
  "last_message_at" = m."created_at",
  "last_message_body" = m."body",
  "last_message_sender_id" = m."sender_id"
FROM (
  SELECT DISTINCT ON ("conversation_id")
    "conversation_id",
    "created_at",
    "body",
    "sender_id"
  FROM "messages"
  ORDER BY "conversation_id", "created_at" DESC
) m
WHERE c."id" = m."conversation_id";
