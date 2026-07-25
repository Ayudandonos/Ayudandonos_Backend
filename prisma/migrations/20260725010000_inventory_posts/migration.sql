-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('IN', 'OUT');

-- CreateEnum
CREATE TYPE "PostReactionType" AS ENUM ('LIKE', 'LOVE', 'PROUD');

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" UUID NOT NULL,
    "foundation_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "quantity_available" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_outbounds" (
    "id" UUID NOT NULL,
    "foundation_id" UUID NOT NULL,
    "campaign_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "total_quantity_delivered" INTEGER NOT NULL,
    "created_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_outbounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_outbound_lines" (
    "id" UUID NOT NULL,
    "outbound_id" UUID NOT NULL,
    "inventory_item_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "inventory_outbound_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" UUID NOT NULL,
    "foundation_id" UUID NOT NULL,
    "inventory_item_id" UUID NOT NULL,
    "outbound_id" UUID,
    "type" "StockMovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "note" TEXT,
    "created_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "foundation_posts" (
    "id" UUID NOT NULL,
    "foundation_id" UUID NOT NULL,
    "campaign_id" UUID NOT NULL,
    "outbound_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "total_quantity_delivered" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "published_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "foundation_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "foundation_post_lines" (
    "id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "inventory_item_id" UUID,
    "item_name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "foundation_post_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "foundation_post_images" (
    "id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "image_url" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "foundation_post_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_reactions" (
    "id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "PostReactionType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "post_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_comments" (
    "id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "post_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inventory_items_foundation_id_idx" ON "inventory_items"("foundation_id");

-- CreateIndex
CREATE INDEX "inventory_outbounds_foundation_id_created_at_idx" ON "inventory_outbounds"("foundation_id", "created_at");

-- CreateIndex
CREATE INDEX "inventory_outbounds_campaign_id_idx" ON "inventory_outbounds"("campaign_id");

-- CreateIndex
CREATE INDEX "inventory_outbound_lines_outbound_id_idx" ON "inventory_outbound_lines"("outbound_id");

-- CreateIndex
CREATE INDEX "stock_movements_foundation_id_created_at_idx" ON "stock_movements"("foundation_id", "created_at");

-- CreateIndex
CREATE INDEX "stock_movements_inventory_item_id_idx" ON "stock_movements"("inventory_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "foundation_posts_outbound_id_key" ON "foundation_posts"("outbound_id");

-- CreateIndex
CREATE INDEX "foundation_posts_foundation_id_published_at_idx" ON "foundation_posts"("foundation_id", "published_at");

-- CreateIndex
CREATE UNIQUE INDEX "foundation_posts_foundation_id_slug_key" ON "foundation_posts"("foundation_id", "slug");

-- CreateIndex
CREATE INDEX "foundation_post_lines_post_id_idx" ON "foundation_post_lines"("post_id");

-- CreateIndex
CREATE INDEX "foundation_post_images_post_id_sort_order_idx" ON "foundation_post_images"("post_id", "sort_order");

-- CreateIndex
CREATE INDEX "post_reactions_post_id_idx" ON "post_reactions"("post_id");

-- CreateIndex
CREATE UNIQUE INDEX "post_reactions_post_id_user_id_key" ON "post_reactions"("post_id", "user_id");

-- CreateIndex
CREATE INDEX "post_comments_post_id_created_at_idx" ON "post_comments"("post_id", "created_at");

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_foundation_id_fkey" FOREIGN KEY ("foundation_id") REFERENCES "foundations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_outbounds" ADD CONSTRAINT "inventory_outbounds_foundation_id_fkey" FOREIGN KEY ("foundation_id") REFERENCES "foundations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_outbounds" ADD CONSTRAINT "inventory_outbounds_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_outbounds" ADD CONSTRAINT "inventory_outbounds_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_outbound_lines" ADD CONSTRAINT "inventory_outbound_lines_outbound_id_fkey" FOREIGN KEY ("outbound_id") REFERENCES "inventory_outbounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_outbound_lines" ADD CONSTRAINT "inventory_outbound_lines_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_foundation_id_fkey" FOREIGN KEY ("foundation_id") REFERENCES "foundations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_outbound_id_fkey" FOREIGN KEY ("outbound_id") REFERENCES "inventory_outbounds"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "foundation_posts" ADD CONSTRAINT "foundation_posts_foundation_id_fkey" FOREIGN KEY ("foundation_id") REFERENCES "foundations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "foundation_posts" ADD CONSTRAINT "foundation_posts_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "foundation_posts" ADD CONSTRAINT "foundation_posts_outbound_id_fkey" FOREIGN KEY ("outbound_id") REFERENCES "inventory_outbounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "foundation_post_lines" ADD CONSTRAINT "foundation_post_lines_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "foundation_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "foundation_post_lines" ADD CONSTRAINT "foundation_post_lines_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "foundation_post_images" ADD CONSTRAINT "foundation_post_images_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "foundation_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_reactions" ADD CONSTRAINT "post_reactions_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "foundation_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_reactions" ADD CONSTRAINT "post_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "foundation_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
