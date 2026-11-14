CREATE TYPE "public"."family_role" AS ENUM('owner', 'editor', 'viewer');--> statement-breakpoint
CREATE TABLE "family_member" (
	"family_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "family_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "family_member_family_id_user_id_pk" PRIMARY KEY("family_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "family_invite" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"token" text NOT NULL,
	"role" "family_role" DEFAULT 'viewer' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "family_invite_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "app_user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "app_user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "family_member" ADD CONSTRAINT "family_member_family_id_family_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."family"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_member" ADD CONSTRAINT "family_member_user_id_app_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."app_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_invite" ADD CONSTRAINT "family_invite_family_id_family_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."family"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "family_member_user_idx" ON "family_member" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "family_invite_family_idx" ON "family_invite" USING btree ("family_id");