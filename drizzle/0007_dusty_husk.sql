CREATE TABLE "game_configurations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gameId" uuid NOT NULL,
	"encryptedConfig" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now(),
	CONSTRAINT "game_configurations_gameId_unique" UNIQUE("gameId")
);
--> statement-breakpoint
CREATE TABLE "provider_configurations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"providerId" uuid NOT NULL,
	"encryptedConfig" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now(),
	CONSTRAINT "provider_configurations_providerId_unique" UNIQUE("providerId")
);
--> statement-breakpoint
ALTER TABLE "game_configurations" ADD CONSTRAINT "game_configurations_gameId_games_id_fk" FOREIGN KEY ("gameId") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_configurations" ADD CONSTRAINT "provider_configurations_providerId_providers_id_fk" FOREIGN KEY ("providerId") REFERENCES "public"."providers"("id") ON DELETE cascade ON UPDATE no action;