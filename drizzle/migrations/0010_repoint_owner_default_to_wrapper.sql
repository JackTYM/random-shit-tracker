ALTER TABLE "items" ALTER COLUMN "owner_id" SET DEFAULT public.current_owner_id();--> statement-breakpoint
ALTER TABLE "model_airplanes" ALTER COLUMN "owner_id" SET DEFAULT public.current_owner_id();--> statement-breakpoint
ALTER TABLE "model_rocket_kits" ALTER COLUMN "owner_id" SET DEFAULT public.current_owner_id();--> statement-breakpoint
ALTER TABLE "model_rocket_parts" ALTER COLUMN "owner_id" SET DEFAULT public.current_owner_id();--> statement-breakpoint
ALTER TABLE "other_collectables" ALTER COLUMN "owner_id" SET DEFAULT public.current_owner_id();--> statement-breakpoint
ALTER TABLE "printed_materials" ALTER COLUMN "owner_id" SET DEFAULT public.current_owner_id();--> statement-breakpoint
ALTER TABLE "rocket_motors" ALTER COLUMN "owner_id" SET DEFAULT public.current_owner_id();--> statement-breakpoint
ALTER TABLE "item_links" ALTER COLUMN "owner_id" SET DEFAULT public.current_owner_id();--> statement-breakpoint
ALTER TABLE "item_photos" ALTER COLUMN "owner_id" SET DEFAULT public.current_owner_id();