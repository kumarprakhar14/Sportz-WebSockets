CREATE TYPE "public"."match_status" AS ENUM('scheduled', 'live', 'finished');--> statement-breakpoint
CREATE TABLE "commentary" (
	"id" serial PRIMARY KEY NOT NULL,
	"match_id" integer NOT NULL,
	"minute" integer,
	"sequence" integer,
	"period" integer,
	"event_type" varchar,
	"actor" varchar,
	"team" varchar,
	"message" text,
	"metadata" jsonb,
	"tags" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" serial PRIMARY KEY NOT NULL,
	"sport" varchar NOT NULL,
	"home_team" varchar NOT NULL,
	"away_team" varchar NOT NULL,
	"status" "match_status" DEFAULT 'scheduled' NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp,
	"home_score" integer DEFAULT 0 NOT NULL,
	"away_score" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "commentary" ADD CONSTRAINT "commentary_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;