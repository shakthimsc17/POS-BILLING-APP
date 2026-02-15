-- =====================================================
-- REMOVE UNUSED TABLES MIGRATION
-- =====================================================
-- Removes translations and item_code_prefixes tables
-- These are unused as the system uses hardcoded translations
-- and supplier codes instead of prefixes

-- =====================================================
-- DROP UNUSED TABLES
-- =====================================================

-- Drop translations table (unused - frontend uses hardcoded translations)
DROP TABLE IF EXISTS translations CASCADE;

-- Drop item_code_prefixes table (unused - items use supplier codes)
DROP TABLE IF EXISTS item_code_prefixes CASCADE;

-- =====================================================
-- REMOVE UNUSED INDEXES AND CONSTRAINTS
-- =====================================================
-- (Indexes are automatically dropped with tables)

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Unused tables removal completed successfully';
  RAISE NOTICE '- Dropped translations table (unused - using hardcoded translations)';
  RAISE NOTICE '- Dropped item_code_prefixes table (unused - using supplier codes)';
  RAISE NOTICE '- Database schema simplified and cleaned up';
END $$;
