ALTER TABLE "items" ALTER COLUMN "user_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "items" ALTER COLUMN "image_width" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "items" ALTER COLUMN "image_height" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "categories" ALTER COLUMN "user_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "outfits" ALTER COLUMN "user_id" SET NOT NULL;
