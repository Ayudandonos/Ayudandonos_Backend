-- CreateEnum
CREATE TYPE "FoundationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "FoundationDocumentType" AS ENUM ('RUT', 'LEGAL_EXISTENCE_CERTIFICATE', 'LEGAL_REPRESENTATIVE_ID', 'BANK_CERTIFICATION');

-- CreateEnum
CREATE TYPE "SocialNetworkType" AS ENUM ('FACEBOOK', 'INSTAGRAM', 'X', 'LINKEDIN', 'YOUTUBE', 'TIKTOK', 'OTHER');

-- AlterTable: expand foundations profile
ALTER TABLE "foundations" ADD COLUMN "nit" TEXT;
ALTER TABLE "foundations" ADD COLUMN "category" TEXT;
ALTER TABLE "foundations" ADD COLUMN "mission" TEXT;
ALTER TABLE "foundations" ADD COLUMN "vision" TEXT;
ALTER TABLE "foundations" ADD COLUMN "city" TEXT;
ALTER TABLE "foundations" ADD COLUMN "department" TEXT;
ALTER TABLE "foundations" ADD COLUMN "address" TEXT;
ALTER TABLE "foundations" ADD COLUMN "institutional_email" TEXT;
ALTER TABLE "foundations" ADD COLUMN "phone" TEXT;
ALTER TABLE "foundations" ADD COLUMN "website" TEXT;
ALTER TABLE "foundations" ADD COLUMN "legal_representative_name" TEXT;
ALTER TABLE "foundations" ADD COLUMN "legal_representative_document" TEXT;
ALTER TABLE "foundations" ADD COLUMN "logo_url" TEXT;
ALTER TABLE "foundations" ADD COLUMN "status" "FoundationStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "foundations" ADD COLUMN "verified_at" TIMESTAMP(3);
ALTER TABLE "foundations" ADD COLUMN "rejected_at" TIMESTAMP(3);
ALTER TABLE "foundations" ADD COLUMN "rejection_reason" TEXT;
ALTER TABLE "foundations" ADD COLUMN "admin_notes" TEXT;

-- Migrate legacy is_verified to status
UPDATE "foundations"
SET "status" = 'VERIFIED', "verified_at" = COALESCE("updated_at", NOW())
WHERE "is_verified" = true;

UPDATE "foundations"
SET "status" = 'PENDING'
WHERE "is_verified" = false;

-- Backfill contact defaults from user account
UPDATE "foundations" AS f
SET
  "institutional_email" = u."email",
  "legal_representative_name" = u."full_name"
FROM "users" AS u
WHERE f."user_id" = u."id";

ALTER TABLE "foundations" DROP COLUMN "is_verified";

-- CreateIndex
CREATE UNIQUE INDEX "foundations_nit_key" ON "foundations"("nit");

-- CreateIndex
CREATE INDEX "foundations_status_idx" ON "foundations"("status");

-- CreateIndex
CREATE INDEX "foundations_category_idx" ON "foundations"("category");

-- CreateIndex
CREATE INDEX "foundations_city_idx" ON "foundations"("city");

-- CreateIndex
CREATE INDEX "foundations_department_idx" ON "foundations"("department");

-- CreateTable
CREATE TABLE "foundation_social_links" (
    "id" UUID NOT NULL,
    "foundation_id" UUID NOT NULL,
    "network" "SocialNetworkType" NOT NULL,
    "url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "foundation_social_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "foundation_documents" (
    "id" UUID NOT NULL,
    "foundation_id" UUID NOT NULL,
    "type" "FoundationDocumentType" NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "foundation_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "foundation_social_links_foundation_id_network_key" ON "foundation_social_links"("foundation_id", "network");

-- CreateIndex
CREATE UNIQUE INDEX "foundation_documents_foundation_id_type_key" ON "foundation_documents"("foundation_id", "type");

-- AddForeignKey
ALTER TABLE "foundation_social_links" ADD CONSTRAINT "foundation_social_links_foundation_id_fkey" FOREIGN KEY ("foundation_id") REFERENCES "foundations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "foundation_documents" ADD CONSTRAINT "foundation_documents_foundation_id_fkey" FOREIGN KEY ("foundation_id") REFERENCES "foundations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
