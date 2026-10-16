CREATE TABLE "departments" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "departments_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(80) NOT NULL,
	"slug" varchar(80) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "departments_name_unique" UNIQUE("name"),
	CONSTRAINT "departments_slug_unique" UNIQUE("slug"),
	CONSTRAINT "departments_name_not_blank" CHECK (btrim("departments"."name") <> ''),
	CONSTRAINT "departments_slug_not_blank" CHECK (btrim("departments"."slug") <> '')
);
--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "department_id" integer;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "reports_department_id_idx" ON "reports" USING btree ("department_id");