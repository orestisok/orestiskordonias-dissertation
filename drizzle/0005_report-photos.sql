CREATE TABLE "report_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"object_key" text NOT NULL,
	"position" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "report_photos_object_key_unique" UNIQUE("object_key"),
	CONSTRAINT "report_photos_report_id_position_unique" UNIQUE("report_id","position"),
	CONSTRAINT "report_photos_object_key_not_blank" CHECK (btrim("report_photos"."object_key") <> ''),
	CONSTRAINT "report_photos_object_key_not_url" CHECK ("report_photos"."object_key" !~* '^[a-z]+://'),
	CONSTRAINT "report_photos_position_non_negative" CHECK ("report_photos"."position" >= 0)
);
--> statement-breakpoint
ALTER TABLE "report_photos" ADD CONSTRAINT "report_photos_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;