CREATE TABLE "billing_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"env_id" uuid NOT NULL,
	"concept" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"currency" text DEFAULT 'MXN' NOT NULL,
	"payment_type" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"due_date" date NOT NULL,
	"paid_at" timestamp with time zone,
	"cfdi_folio" text,
	"last_reminded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "billing_records_currency_check" CHECK ("billing_records"."currency" in ('MXN')),
	CONSTRAINT "billing_records_payment_type_check" CHECK ("billing_records"."payment_type" in ('bank_transfer', 'stripe', 'cash', 'bank_check')),
	CONSTRAINT "billing_records_status_check" CHECK ("billing_records"."status" in ('paid', 'pending', 'overdue'))
);
--> statement-breakpoint
CREATE TABLE "billing_reference" (
	"env_id" uuid PRIMARY KEY NOT NULL,
	"business_name" text NOT NULL,
	"razon_social" text NOT NULL,
	"legal_owner" text,
	"rfc" text NOT NULL,
	"regimen_fiscal" text NOT NULL,
	"uso_cfdi" text NOT NULL,
	"tax_zip" text NOT NULL,
	"owner_phone" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "billing_reference_regimen_fiscal_check" CHECK ("billing_reference"."regimen_fiscal" in ('601', '612', '626')),
	CONSTRAINT "billing_reference_uso_cfdi_check" CHECK ("billing_reference"."uso_cfdi" in ('G01', 'G03', 'S01'))
);
--> statement-breakpoint
ALTER TABLE "billing_records" ADD CONSTRAINT "billing_records_env_id_tenant_registry_env_id_fk" FOREIGN KEY ("env_id") REFERENCES "public"."tenant_registry"("env_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_reference" ADD CONSTRAINT "billing_reference_env_id_tenant_registry_env_id_fk" FOREIGN KEY ("env_id") REFERENCES "public"."tenant_registry"("env_id") ON DELETE no action ON UPDATE no action;