ALTER TABLE "categories" DROP CONSTRAINT IF EXISTS "categories_name_unique";
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "categories_user_id_name_unique" ON "categories" USING btree ("user_id","name");
