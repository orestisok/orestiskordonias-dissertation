CREATE TYPE "public"."report_status" AS ENUM('submitted', 'acknowledged', 'in_progress', 'resolved', 'rejected');--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference_number" integer GENERATED ALWAYS AS IDENTITY (sequence name "reports_reference_number_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1000 CACHE 1),
	"title" varchar(120) NOT NULL,
	"description" varchar(2000) NOT NULL,
	"location" geometry(point, 4326) NOT NULL,
	"address" varchar(255),
	"status" "report_status" DEFAULT 'submitted' NOT NULL,
	"category_id" integer NOT NULL,
	"reporter_id" text,
	"assigned_to_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reports_reference_number_unique" UNIQUE("reference_number"),
	CONSTRAINT "reports_title_not_blank" CHECK (btrim("reports"."title") <> ''),
	CONSTRAINT "reports_description_not_blank" CHECK (btrim("reports"."description") <> '')
);
--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_user_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_assigned_to_id_user_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "reports_location_idx" ON "reports" USING gist ("location");--> statement-breakpoint
CREATE INDEX "reports_status_idx" ON "reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "reports_category_id_idx" ON "reports" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "reports_reporter_id_idx" ON "reports" USING btree ("reporter_id");--> statement-breakpoint
CREATE INDEX "reports_assigned_to_id_idx" ON "reports" USING btree ("assigned_to_id");