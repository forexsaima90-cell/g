DO $$ BEGIN
	CREATE TYPE "public"."user_status" AS ENUM('active', 'ended', 'revoked');
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"username" text PRIMARY KEY NOT NULL,
	"email" text,
	"license_key" text NOT NULL,
	"device_id" text,
	"valid_from" timestamp with time zone NOT NULL,
	"valid_till" timestamp with time zone NOT NULL,
	"status" "user_status" DEFAULT 'active' NOT NULL,
	CONSTRAINT "users_license_key_unique" UNIQUE("license_key"),
	CONSTRAINT "users_device_id_unique" UNIQUE("device_id")
);
