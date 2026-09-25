ALTER TABLE "servers" ADD COLUMN "playerCount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "servers" ADD COLUMN "lastHeartbeatAt" timestamp;--> statement-breakpoint
ALTER TABLE "servers" ADD COLUMN "lastStartedAt" timestamp;--> statement-breakpoint
ALTER TABLE "servers" ADD COLUMN "lastStoppedAt" timestamp;