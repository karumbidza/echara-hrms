-- Add features column to tenants table
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "features" JSONB;

-- Add comment explaining the column
COMMENT ON COLUMN "tenants"."features" IS 'Tenant-specific feature overrides - array of enabled features';
