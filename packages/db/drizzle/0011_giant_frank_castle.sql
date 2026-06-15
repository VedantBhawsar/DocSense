ALTER TABLE "messages" ADD COLUMN "model" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "prompt_tokens" integer;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "completion_tokens" integer;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "total_tokens" integer;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "cost_cents" numeric(10, 6);