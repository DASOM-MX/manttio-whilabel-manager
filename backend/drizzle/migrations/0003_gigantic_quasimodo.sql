CREATE TABLE "contracts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"env_id" uuid NOT NULL,
	"plan" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"signed_at" date,
	"starts_at" date NOT NULL,
	"ends_at" date,
	"document_url" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contracts_plan_check" CHECK ("contracts"."plan" in ('full', 'monthly')),
	CONSTRAINT "contracts_status_check" CHECK ("contracts"."status" in ('draft', 'active', 'expired', 'terminated'))
);
--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_env_id_tenant_registry_env_id_fk" FOREIGN KEY ("env_id") REFERENCES "public"."tenant_registry"("env_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "contracts_one_active_per_tenant_idx" ON "contracts" USING btree ("env_id") WHERE "contracts"."status" = 'active';