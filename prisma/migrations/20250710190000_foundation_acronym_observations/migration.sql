-- AlterTable
ALTER TABLE "foundations" ADD COLUMN "acronym" TEXT;

-- CreateTable
CREATE TABLE "foundation_admin_observations" (
    "id" UUID NOT NULL,
    "foundation_id" UUID NOT NULL,
    "author_id" UUID,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "foundation_admin_observations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "foundation_admin_observations_foundation_id_created_at_idx" ON "foundation_admin_observations"("foundation_id", "created_at");

-- AddForeignKey
ALTER TABLE "foundation_admin_observations" ADD CONSTRAINT "foundation_admin_observations_foundation_id_fkey" FOREIGN KEY ("foundation_id") REFERENCES "foundations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "foundation_admin_observations" ADD CONSTRAINT "foundation_admin_observations_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
