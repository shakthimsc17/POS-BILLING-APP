-- Ensure uuid-ossp extension for uuid_generate_v4()
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set default for settings.id so Prisma create() works without explicit id
ALTER TABLE "settings" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4();
