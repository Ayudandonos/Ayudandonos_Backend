-- CreateEnum
CREATE TYPE "FoundationBranchStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "foundation_branches" (
    "id" UUID NOT NULL,
    "foundation_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "reference" TEXT,
    "phone" TEXT NOT NULL,
    "opening_hours" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "status" "FoundationBranchStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "foundation_branches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "foundation_branches_foundation_id_idx" ON "foundation_branches"("foundation_id");

-- CreateIndex
CREATE INDEX "foundation_branches_foundation_id_status_idx" ON "foundation_branches"("foundation_id", "status");

-- AddForeignKey
ALTER TABLE "foundation_branches" ADD CONSTRAINT "foundation_branches_foundation_id_fkey" FOREIGN KEY ("foundation_id") REFERENCES "foundations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
