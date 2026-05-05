ALTER TABLE "categories" DROP CONSTRAINT "categories_name_unique";--> statement-breakpoint
ALTER TABLE "items" ALTER COLUMN "image_width" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "items" ALTER COLUMN "image_height" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "items" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "outfits" ALTER COLUMN "layout" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "outfits" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "categories_user_id_name_unique" ON "categories" USING btree ("user_id","name");