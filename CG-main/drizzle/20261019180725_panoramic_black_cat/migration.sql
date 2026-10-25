CREATE TYPE "user_status" AS ENUM('active', 'ended', 'revoked');--> statement-breakpoint
CREATE TABLE "users" (
	"username" text PRIMARY KEY,
	"email" text,
	"license_key" text NOT NULL UNIQUE,
	"device_id" text UNIQUE,
	"valid_from" timestamp with time zone NOT NULL,
	"valid_till" timestamp with time zone NOT NULL,
	"status" "user_status" DEFAULT 'active'::"user_status" NOT NULL
);
