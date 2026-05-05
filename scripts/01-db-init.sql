-- PawBook IITB: Database Schema Setup
-- Initialization script for Duplicate Detection, Trust Score, and Care Tracking

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CORE TABLES (These should already exist, but we list them for reference)
-- ============================================================================

-- Assuming auth.users exists from Supabase Auth
-- CREATE TABLE auth.users (
--   id UUID PRIMARY KEY,
--   email VARCHAR(255) UNIQUE,
--   created_at TIMESTAMP DEFAULT now()
-- );

-- Main animals table (extend with new columns)
CREATE TABLE IF NOT EXISTS animals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  species VARCHAR(100),
  description TEXT,
  location VARCHAR(255),
  location_id UUID,
  image_url TEXT,
  status VARCHAR(50) DEFAULT 'active',
  
  -- New fields for duplicate detection
  name_normalized VARCHAR(255),
  
  -- New fields for care tracking
  last_seen_at TIMESTAMP,
  last_fed_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- ============================================================================
-- NEW TABLE 1: USER PROFILES (Trust Score System)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Trust scoring
  trust_score INT DEFAULT 50 CHECK (trust_score >= 0 AND trust_score <= 100),
  
  -- Contribution metrics
  contributions_count INT DEFAULT 0,
  verified_contributions INT DEFAULT 0,
  accuracy_score FLOAT DEFAULT 1.0 CHECK (accuracy_score >= 0 AND accuracy_score <= 1.0),
  
  -- Metadata
  joined_date TIMESTAMP DEFAULT now(),
  is_moderator BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- ============================================================================
-- NEW TABLE 2: CARE EVENTS (Last Seen/Fed Tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS care_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- References
  animal_id UUID NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  reported_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Event details
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('seen', 'fed', 'medical', 'note')),
  event_date TIMESTAMP NOT NULL,
  
  -- Location and context
  location VARCHAR(255),
  notes TEXT,
  photo_url TEXT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- ============================================================================
-- NEW TABLE 3: CONTRIBUTION AUDIT (Track all user actions)
-- ============================================================================

CREATE TABLE IF NOT EXISTS contribution_audit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- References
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  animal_id UUID REFERENCES animals(id) ON DELETE SET NULL,
  
  -- Action tracking
  action VARCHAR(50) NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'verified', 'flagged')),
  action_details JSONB,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT now()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Animals table indexes
CREATE INDEX IF NOT EXISTS idx_animals_name_normalized ON animals(name_normalized);
CREATE INDEX IF NOT EXISTS idx_animals_location_id ON animals(location_id);
CREATE INDEX IF NOT EXISTS idx_animals_species ON animals(species);
CREATE INDEX IF NOT EXISTS idx_animals_created_by ON animals(created_by);

-- Care events indexes
CREATE INDEX IF NOT EXISTS idx_care_events_animal_id ON care_events(animal_id);
CREATE INDEX IF NOT EXISTS idx_care_events_reported_by ON care_events(reported_by);
CREATE INDEX IF NOT EXISTS idx_care_events_event_date ON care_events(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_care_events_event_type ON care_events(event_type);

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_trust_score ON user_profiles(trust_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_verified ON user_profiles(is_verified);

-- Contribution audit indexes
CREATE INDEX IF NOT EXISTS idx_contribution_audit_user_id ON contribution_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_contribution_audit_animal_id ON contribution_audit(animal_id);
CREATE INDEX IF NOT EXISTS idx_contribution_audit_action ON contribution_audit(action);
CREATE INDEX IF NOT EXISTS idx_contribution_audit_created_at ON contribution_audit(created_at DESC);

-- ============================================================================
-- SEED DATA (Optional: Create test users and animals)
-- ============================================================================

-- Note: In production, these would be created via auth signup
-- For testing, seed a few user profiles:

-- After Supabase users are created, initialize their profiles with:
-- INSERT INTO user_profiles (id) VALUES (user_id) ON CONFLICT DO NOTHING;

-- ============================================================================
-- TRIGGER: Auto-normalize animal names for duplicate detection
-- ============================================================================

CREATE OR REPLACE FUNCTION normalize_animal_name()
RETURNS TRIGGER AS $$
BEGIN
  NEW.name_normalized := LOWER(TRIM(NEW.name));
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS animals_normalize_name ON animals;
CREATE TRIGGER animals_normalize_name
BEFORE INSERT OR UPDATE ON animals
FOR EACH ROW
EXECUTE FUNCTION normalize_animal_name();

-- ============================================================================
-- TRIGGER: Auto-create user profile on new user (requires pg_cron or app logic)
-- ============================================================================

CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: This trigger requires Postgres to have access to auth schema
-- For Supabase, it's better to handle this in the application layer

-- ============================================================================
-- HELPER FUNCTION: Calculate care status for an animal
-- ============================================================================

CREATE OR REPLACE FUNCTION get_animal_care_status(animal_uuid UUID)
RETURNS TABLE(status VARCHAR(50), last_seen TIMESTAMP, last_fed TIMESTAMP, days_since_seen INT, days_since_fed INT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE
      WHEN COALESCE(EXTRACT(DAY FROM now() - animals.last_seen_at), 999) <= 1 
           AND COALESCE(EXTRACT(DAY FROM now() - animals.last_fed_at), 999) <= 0.75
      THEN 'active_care'::VARCHAR(50)
      WHEN COALESCE(EXTRACT(DAY FROM now() - animals.last_seen_at), 999) <= 3
           AND COALESCE(EXTRACT(DAY FROM now() - animals.last_fed_at), 999) <= 2
      THEN 'moderate'::VARCHAR(50)
      ELSE 'at_risk'::VARCHAR(50)
    END,
    animals.last_seen_at,
    animals.last_fed_at,
    CAST(COALESCE(EXTRACT(DAY FROM now() - animals.last_seen_at), 999) AS INT),
    CAST(COALESCE(EXTRACT(DAY FROM now() - animals.last_fed_at), 999) AS INT)
  FROM animals
  WHERE animals.id = animal_uuid;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- HELPER FUNCTION: Calculate Levenshtein distance for duplicate detection
-- ============================================================================

CREATE OR REPLACE FUNCTION levenshtein_distance(s1 TEXT, s2 TEXT)
RETURNS INT AS $$
DECLARE
  len1 INT := LENGTH(s1);
  len2 INT := LENGTH(s2);
  d INT[][] := ARRAY[]::INT[][];
  i INT;
  j INT;
  cost INT;
BEGIN
  FOR i IN 0..len1 LOOP
    d[i][0] := i;
  END LOOP;
  FOR j IN 0..len2 LOOP
    d[0][j] := j;
  END LOOP;

  FOR i IN 1..len1 LOOP
    FOR j IN 1..len2 LOOP
      cost := CASE WHEN SUBSTRING(s1, i, 1) = SUBSTRING(s2, j, 1) THEN 0 ELSE 1 END;
      d[i][j] := LEAST(
        d[i-1][j] + 1,
        d[i][j-1] + 1,
        d[i-1][j-1] + cost
      );
    END LOOP;
  END LOOP;
  RETURN d[len1][len2];
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- All tables and functions are now ready for use!
-- ============================================================================
