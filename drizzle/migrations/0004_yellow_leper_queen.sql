CREATE INDEX "item_links_item_id_idx" ON "item_links" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "item_links_related_item_id_idx" ON "item_links" USING btree ("related_item_id");--> statement-breakpoint
CREATE INDEX "item_photos_item_id_idx" ON "item_photos" USING btree ("item_id");