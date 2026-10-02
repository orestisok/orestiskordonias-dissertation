CREATE TYPE "public"."report_event_type" AS ENUM('status_change', 'comment', 'assignment');--> statement-breakpoint
CREATE TABLE "report_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"actor_id" text,
	"type" "report_event_type" NOT NULL,
	"from_status" "report_status",
	"to_status" "report_status",
	"body" varchar(2000),
	"is_public" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "report_events_rejection_has_reason" CHECK ("report_events"."to_status" IS DISTINCT FROM 'rejected' OR ("report_events"."is_public" AND btrim(coalesce("report_events"."body", '')) <> '')),
	CONSTRAINT "report_events_status_change_has_to_status" CHECK ("report_events"."type" <> 'status_change' OR "report_events"."to_status" IS NOT NULL),
	CONSTRAINT "report_events_comment_has_body" CHECK ("report_events"."type" <> 'comment' OR btrim(coalesce("report_events"."body", '')) <> '')
);
--> statement-breakpoint
ALTER TABLE "report_events" ADD CONSTRAINT "report_events_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_events" ADD CONSTRAINT "report_events_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "report_events_report_id_created_at_idx" ON "report_events" USING btree ("report_id","created_at");--> statement-breakpoint
CREATE INDEX "report_events_actor_id_idx" ON "report_events" USING btree ("actor_id");