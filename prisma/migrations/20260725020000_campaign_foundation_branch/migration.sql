-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN "foundation_branch_id" UUID;

-- Backfill: sede principal activa de cada fundacion
UPDATE "campaigns" AS c
SET "foundation_branch_id" = (
  SELECT b.id
  FROM "foundation_branches" AS b
  WHERE b.foundation_id = c.foundation_id
    AND b.status = 'ACTIVE'
  ORDER BY b.created_at ASC
  LIMIT 1
);

-- Campanas sin sede (no deberia ocurrir tras seed) quedan con primera sede de la fundacion
UPDATE "campaigns" AS c
SET "foundation_branch_id" = (
  SELECT b.id
  FROM "foundation_branches" AS b
  WHERE b.foundation_id = c.foundation_id
  ORDER BY b.created_at ASC
  LIMIT 1
)
WHERE "foundation_branch_id" IS NULL;

ALTER TABLE "campaigns" ALTER COLUMN "foundation_branch_id" SET NOT NULL;

-- CreateIndex
CREATE INDEX "campaigns_foundation_branch_id_idx" ON "campaigns"("foundation_branch_id");

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_foundation_branch_id_fkey" FOREIGN KEY ("foundation_branch_id") REFERENCES "foundation_branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
