-- Donaciones: sede de acopio y recepcion
ALTER TABLE "donations" ADD COLUMN "foundation_branch_id" UUID;
ALTER TABLE "donations" ADD COLUMN "received_quantity" INTEGER;
ALTER TABLE "donations" ADD COLUMN "received_at" TIMESTAMP(3);
ALTER TABLE "donations" ADD COLUMN "reception_notes" TEXT;

-- Backfill sede desde campana de la necesidad
UPDATE "donations" AS d
SET "foundation_branch_id" = c."foundation_branch_id"
FROM "needs" AS n
INNER JOIN "campaigns" AS c ON c."id" = n."campaign_id"
WHERE d."need_id" = n."id"
  AND d."foundation_branch_id" IS NULL;

UPDATE "donations" AS d
SET "foundation_branch_id" = (
  SELECT b."id"
  FROM "foundation_branches" AS b
  INNER JOIN "needs" AS n ON n."id" = d."need_id"
  INNER JOIN "campaigns" AS c ON c."id" = n."campaign_id"
  WHERE b."foundation_id" = c."foundation_id"
  ORDER BY b."created_at" ASC
  LIMIT 1
)
WHERE "foundation_branch_id" IS NULL;

ALTER TABLE "donations" ALTER COLUMN "foundation_branch_id" SET NOT NULL;

-- Reemplazar enum DonationStatus (mapea estados legacy en el USING)
CREATE TYPE "DonationStatus_new" AS ENUM ('COMMITTED', 'RECEIVED', 'CANCELLED');

ALTER TABLE "donations"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "DonationStatus_new"
  USING (
    CASE "status"::text
      WHEN 'IN_TRANSIT' THEN 'RECEIVED'::"DonationStatus_new"
      WHEN 'DELIVERED' THEN 'RECEIVED'::"DonationStatus_new"
      WHEN 'CONFIRMED' THEN 'RECEIVED'::"DonationStatus_new"
      ELSE "status"::text::"DonationStatus_new"
    END
  );

ALTER TABLE "donation_status_history"
  ALTER COLUMN "from_status" TYPE "DonationStatus_new"
  USING (
    CASE
      WHEN "from_status" IS NULL THEN NULL
      WHEN "from_status"::text IN ('IN_TRANSIT', 'DELIVERED', 'CONFIRMED') THEN 'RECEIVED'::"DonationStatus_new"
      ELSE "from_status"::text::"DonationStatus_new"
    END
  );

ALTER TABLE "donation_status_history"
  ALTER COLUMN "to_status" TYPE "DonationStatus_new"
  USING (
    CASE
      WHEN "to_status"::text IN ('IN_TRANSIT', 'DELIVERED', 'CONFIRMED') THEN 'RECEIVED'::"DonationStatus_new"
      ELSE "to_status"::text::"DonationStatus_new"
    END
  );

DROP TYPE "DonationStatus";
ALTER TYPE "DonationStatus_new" RENAME TO "DonationStatus";

ALTER TABLE "donations" ALTER COLUMN "status" SET DEFAULT 'COMMITTED';

-- Completar datos de recepcion para donaciones migradas a RECEIVED
UPDATE "donations"
SET "received_quantity" = COALESCE("received_quantity", "quantity"),
    "received_at" = COALESCE("received_at", "updated_at")
WHERE "status" = 'RECEIVED'
  AND ("received_quantity" IS NULL OR "received_at" IS NULL);

ALTER TABLE "donations" DROP COLUMN IF EXISTS "delivery_address";
ALTER TABLE "donations" DROP COLUMN IF EXISTS "delivery_latitude";
ALTER TABLE "donations" DROP COLUMN IF EXISTS "delivery_longitude";

CREATE INDEX "donations_foundation_branch_id_idx" ON "donations"("foundation_branch_id");

ALTER TABLE "donations"
  ADD CONSTRAINT "donations_foundation_branch_id_fkey"
  FOREIGN KEY ("foundation_branch_id") REFERENCES "foundation_branches"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Movimientos de inventario: trazabilidad
ALTER TABLE "stock_movements" ADD COLUMN "donation_id" UUID;
ALTER TABLE "stock_movements" ADD COLUMN "campaign_id" UUID;
ALTER TABLE "stock_movements" ADD COLUMN "foundation_branch_id" UUID;

CREATE INDEX "stock_movements_donation_id_idx" ON "stock_movements"("donation_id");

ALTER TABLE "stock_movements"
  ADD CONSTRAINT "stock_movements_donation_id_fkey"
  FOREIGN KEY ("donation_id") REFERENCES "donations"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "stock_movements"
  ADD CONSTRAINT "stock_movements_campaign_id_fkey"
  FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "stock_movements"
  ADD CONSTRAINT "stock_movements_foundation_branch_id_fkey"
  FOREIGN KEY ("foundation_branch_id") REFERENCES "foundation_branches"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Salidas y publicaciones: sede
ALTER TABLE "inventory_outbounds" ADD COLUMN "foundation_branch_id" UUID;
ALTER TABLE "inventory_outbounds" ADD COLUMN "observations" TEXT;

UPDATE "inventory_outbounds" AS o
SET "foundation_branch_id" = c."foundation_branch_id"
FROM "campaigns" AS c
WHERE c."id" = o."campaign_id"
  AND o."foundation_branch_id" IS NULL;

ALTER TABLE "inventory_outbounds" ALTER COLUMN "foundation_branch_id" SET NOT NULL;

ALTER TABLE "inventory_outbounds"
  ADD CONSTRAINT "inventory_outbounds_foundation_branch_id_fkey"
  FOREIGN KEY ("foundation_branch_id") REFERENCES "foundation_branches"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "inventory_outbounds_foundation_branch_id_idx" ON "inventory_outbounds"("foundation_branch_id");

ALTER TABLE "foundation_posts" ADD COLUMN "foundation_branch_id" UUID;

UPDATE "foundation_posts" AS p
SET "foundation_branch_id" = c."foundation_branch_id"
FROM "campaigns" AS c
WHERE c."id" = p."campaign_id"
  AND p."foundation_branch_id" IS NULL;

ALTER TABLE "foundation_posts" ALTER COLUMN "foundation_branch_id" SET NOT NULL;

ALTER TABLE "foundation_posts"
  ADD CONSTRAINT "foundation_posts_foundation_branch_id_fkey"
  FOREIGN KEY ("foundation_branch_id") REFERENCES "foundation_branches"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "foundation_posts_foundation_branch_id_idx" ON "foundation_posts"("foundation_branch_id");
