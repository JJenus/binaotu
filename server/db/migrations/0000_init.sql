CREATE TYPE "public"."parent_kind" AS ENUM('biological', 'adoptive', 'step');--> statement-breakpoint
CREATE TYPE "public"."sex" AS ENUM('male', 'female', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."union_kind" AS ENUM('marriage', 'partnership', 'other');--> statement-breakpoint
CREATE TYPE "public"."visibility" AS ENUM('public', 'private');--> statement-breakpoint
CREATE TABLE "family" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"visibility" "visibility" DEFAULT 'public' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "family_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "parent_link" (
	"child_id" uuid NOT NULL,
	"parent_id" uuid NOT NULL,
	"kind" "parent_kind" DEFAULT 'biological' NOT NULL,
	CONSTRAINT "parent_link_child_id_parent_id_pk" PRIMARY KEY("child_id","parent_id")
);
--> statement-breakpoint
CREATE TABLE "person" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"given_name" text NOT NULL,
	"family_name" text,
	"sex" "sex" DEFAULT 'unknown' NOT NULL,
	"birth_year" integer,
	"death_year" integer,
	"birth_place" text,
	"notes" text,
	"is_placeholder" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "union" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"partner_a_id" uuid NOT NULL,
	"partner_b_id" uuid NOT NULL,
	"kind" "union_kind" DEFAULT 'partnership' NOT NULL,
	"start_year" integer,
	"end_year" integer
);
--> statement-breakpoint
ALTER TABLE "parent_link" ADD CONSTRAINT "parent_link_child_id_person_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."person"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parent_link" ADD CONSTRAINT "parent_link_parent_id_person_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."person"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person" ADD CONSTRAINT "person_family_id_family_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."family"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "union" ADD CONSTRAINT "union_family_id_family_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."family"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "union" ADD CONSTRAINT "union_partner_a_id_person_id_fk" FOREIGN KEY ("partner_a_id") REFERENCES "public"."person"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "union" ADD CONSTRAINT "union_partner_b_id_person_id_fk" FOREIGN KEY ("partner_b_id") REFERENCES "public"."person"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "parent_link_parent_idx" ON "parent_link" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "person_family_idx" ON "person" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "union_family_idx" ON "union" USING btree ("family_id");