-- AlterTable
ALTER TABLE "foundations" ADD COLUMN "verified_by_id" UUID,
ADD COLUMN "suspended_at" TIMESTAMP(3),
ADD COLUMN "slug" TEXT,
ADD COLUMN "deleted_at" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "foundations_slug_key" ON "foundations"("slug");

-- AddForeignKey
ALTER TABLE "foundations" ADD CONSTRAINT "foundations_verified_by_id_fkey" FOREIGN KEY ("verified_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
