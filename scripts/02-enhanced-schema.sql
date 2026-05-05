-- PawBook IITB Enhanced Schema
-- New features: Image uploads, unique animal IDs, real-time data, medical records, donors, adoption status, memory book

-- ============================================================================
-- STORAGE BUCKETS (Images)
-- ============================================================================
-- Note: These need to be created via Supabase Dashboard, but we document them here:
-- - animals-photos: Animal profile photos
-- - animal-images: Gallery images for animals
-- - medical-records: Medical document storage

-- ============================================================================
-- ENHANCED ANIMALS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS animals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  species VARCHAR(100),
  description TEXT,
  location VARCHAR(255),
  unique_hash VARCHAR(255) UNIQUE, -- Hash of (name + location + species) for duplicate detection
  
  -- Animal Status
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'adopted', 'injured', 'deceased', 'missing')),
  adoption_status VARCHAR(50) DEFAULT 'available' CHECK (adoption_status IN ('available', 'interested', 'adopted', 'not_available')),
  
  -- Media
  profile_image_url TEXT,
  
  -- Care Tracking
  last_seen_at TIMESTAMP,
  last_fed_at TIMESTAMP,
  last_medical_checkup TIMESTAMP,
  
  -- Metadata
  gender VARCHAR(20),
  age_estimate VARCHAR(100),
  distinguishing_marks TEXT,
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  UNIQUE(name, location, species)
);

CREATE INDEX idx_animals_unique_hash ON animals(unique_hash);
CREATE INDEX idx_animals_status ON animals(status);
CREATE INDEX idx_animals_adoption_status ON animals(adoption_status);
CREATE INDEX idx_animals_created_by ON animals(created_by);

-- ============================================================================
-- ANIMAL IMAGES TABLE (Gallery with Real-time support)
-- ============================================================================

CREATE TABLE IF NOT EXISTS animal_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  animal_id UUID NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL, -- Path in Supabase storage
  image_url TEXT,
  caption TEXT,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Metadata
  uploaded_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  
  UNIQUE(animal_id, storage_path)
);

CREATE INDEX idx_animal_images_animal_id ON animal_images(animal_id);
CREATE INDEX idx_animal_images_uploaded_by ON animal_images(uploaded_by);
CREATE INDEX idx_animal_images_uploaded_at ON animal_images(uploaded_at DESC);

-- ============================================================================
-- LIKES TABLE (Real-time with broadcast)
-- ============================================================================

CREATE TABLE IF NOT EXISTS image_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  image_id UUID NOT NULL REFERENCES animal_images(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT now(),
  
  UNIQUE(image_id, user_id)
);

CREATE INDEX idx_image_likes_image_id ON image_likes(image_id);
CREATE INDEX idx_image_likes_user_id ON image_likes(user_id);

-- ============================================================================
-- COMMENTS TABLE (Real-time with broadcast)
-- ============================================================================

CREATE TABLE IF NOT EXISTS image_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  image_id UUID NOT NULL REFERENCES animal_images(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  is_deleted BOOLEAN DEFAULT false
);

CREATE INDEX idx_image_comments_image_id ON image_comments(image_id);
CREATE INDEX idx_image_comments_user_id ON image_comments(user_id);
CREATE INDEX idx_image_comments_created_at ON image_comments(created_at DESC);

-- ============================================================================
-- COMMENTS TABLE - ANIMAL PROFILES (Real-time)
-- ============================================================================

CREATE TABLE IF NOT EXISTS animal_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  animal_id UUID NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  is_deleted BOOLEAN DEFAULT false
);

CREATE INDEX idx_animal_comments_animal_id ON animal_comments(animal_id);
CREATE INDEX idx_animal_comments_user_id ON animal_comments(user_id);
CREATE INDEX idx_animal_comments_created_at ON animal_comments(created_at DESC);

-- ============================================================================
-- MEDICAL RECORDS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS medical_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  animal_id UUID NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  
  -- Medical Info
  record_type VARCHAR(100) NOT NULL CHECK (record_type IN ('vaccination', 'checkup', 'treatment', 'injury', 'surgery', 'prescription')),
  title VARCHAR(255),
  description TEXT,
  
  -- Dates
  record_date TIMESTAMP NOT NULL,
  next_checkup_date TIMESTAMP,
  
  -- Professional Info
  veterinarian_name VARCHAR(255),
  clinic_name VARCHAR(255),
  contact_info VARCHAR(255),
  
  -- Attachments (if any - store path in Supabase)
  document_url TEXT,
  
  -- Metadata
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_medical_records_animal_id ON medical_records(animal_id);
CREATE INDEX idx_medical_records_record_type ON medical_records(record_type);
CREATE INDEX idx_medical_records_created_by ON medical_records(created_by);

-- ============================================================================
-- DONORS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS donors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Donor Info
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  
  -- Affiliation (Student, Faculty, etc)
  donor_type VARCHAR(100) CHECK (donor_type IN ('student', 'faculty', 'staff', 'alumni', 'external')),
  hostel_name VARCHAR(255),
  
  -- Donation Details
  animal_id UUID REFERENCES animals(id) ON DELETE SET NULL,
  donation_date TIMESTAMP DEFAULT now(),
  donation_type VARCHAR(100) CHECK (donation_type IN ('food', 'medical', 'supplies', 'other')),
  donation_description TEXT,
  
  -- Contact Preference
  consent_contact BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_donors_animal_id ON donors(animal_id);
CREATE INDEX idx_donors_donation_date ON donors(donation_date DESC);
CREATE INDEX idx_donors_donor_type ON donors(donor_type);

-- ============================================================================
-- ADOPTION RECORDS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS adoption_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  animal_id UUID NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  
  -- Adopter Info
  adopter_name VARCHAR(255),
  adopter_email VARCHAR(255),
  adopter_phone VARCHAR(20),
  
  -- Adoption Process
  adoption_date TIMESTAMP,
  adoption_status VARCHAR(50) DEFAULT 'interested' CHECK (adoption_status IN ('interested', 'approved', 'adopted', 'returned')),
  
  -- Contact Info
  current_location VARCHAR(255),
  contact_allowed BOOLEAN DEFAULT true,
  
  -- Notes
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_adoption_records_animal_id ON adoption_records(animal_id);
CREATE INDEX idx_adoption_records_adoption_status ON adoption_records(adoption_status);

-- ============================================================================
-- HELP NEEDED TABLE (For injured/needy animals)
-- ============================================================================

CREATE TABLE IF NOT EXISTS help_needed (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  animal_id UUID NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  
  -- Help Type
  help_type VARCHAR(100) NOT NULL CHECK (help_type IN ('medical', 'shelter', 'food', 'transport', 'other')),
  urgency VARCHAR(50) DEFAULT 'moderate' CHECK (urgency IN ('critical', 'high', 'moderate', 'low')),
  
  -- Details
  description TEXT NOT NULL,
  specific_needs TEXT,
  
  -- Status
  status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'unable_to_help')),
  
  -- Contact
  reported_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT now(),
  resolved_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_help_needed_animal_id ON help_needed(animal_id);
CREATE INDEX idx_help_needed_status ON help_needed(status);
CREATE INDEX idx_help_needed_urgency ON help_needed(urgency);

-- ============================================================================
-- EMOTIONAL MEMORY TABLE (For deceased/missing animals)
-- ============================================================================

CREATE TABLE IF NOT EXISTS emotional_memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  animal_id UUID NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  
  -- Memory Details
  title VARCHAR(255) NOT NULL,
  memory_text TEXT NOT NULL,
  memory_date TIMESTAMP, -- When the memory is about
  
  -- Media
  photo_url TEXT,
  
  -- Metadata
  memory_type VARCHAR(100) CHECK (memory_type IN ('happy_moment', 'funny_moment', 'touching_story', 'last_goodbye', 'tribute', 'other')),
  
  shared_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  shared_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_emotional_memories_animal_id ON emotional_memories(animal_id);
CREATE INDEX idx_emotional_memories_shared_by ON emotional_memories(shared_by);
CREATE INDEX idx_emotional_memories_shared_at ON emotional_memories(shared_at DESC);

-- ============================================================================
-- CARE EVENTS TABLE (Enhanced)
-- ============================================================================

CREATE TABLE IF NOT EXISTS care_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  animal_id UUID NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  
  -- Event Details
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('seen', 'fed', 'treated', 'sheltered', 'medical_checkup')),
  
  -- Location & Time
  event_date TIMESTAMP NOT NULL,
  location VARCHAR(255),
  
  -- Details
  notes TEXT,
  photo_url TEXT,
  
  -- Reporter
  reported_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_care_events_animal_id ON care_events(animal_id);
CREATE INDEX idx_care_events_event_type ON care_events(event_type);
CREATE INDEX idx_care_events_reported_by ON care_events(reported_by);
CREATE INDEX idx_care_events_event_date ON care_events(event_date DESC);

-- ============================================================================
-- USER PROFILES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- User Info
  full_name VARCHAR(255),
  hostel_name VARCHAR(255),
  year_of_study VARCHAR(50),
  email VARCHAR(255),
  
  -- Trust System
  trust_score INT DEFAULT 50 CHECK (trust_score >= 0 AND trust_score <= 100),
  contributions_count INT DEFAULT 0,
  verified_contributions INT DEFAULT 0,
  accuracy_score FLOAT DEFAULT 1.0,
  
  -- Status
  is_verified BOOLEAN DEFAULT false,
  is_moderator BOOLEAN DEFAULT false,
  
  -- Preferences
  notify_animal_updates BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_user_profiles_trust_score ON user_profiles(trust_score DESC);
CREATE INDEX idx_user_profiles_is_verified ON user_profiles(is_verified);

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC FIELDS
-- ============================================================================

-- Generate unique hash for duplicate detection
CREATE OR REPLACE FUNCTION generate_animal_unique_hash()
RETURNS TRIGGER AS $$
BEGIN
  NEW.unique_hash := md5(LOWER(TRIM(NEW.name)) || '-' || LOWER(TRIM(COALESCE(NEW.location, ''))) || '-' || LOWER(TRIM(COALESCE(NEW.species, ''))));
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS animals_generate_hash ON animals;
CREATE TRIGGER animals_generate_hash
BEFORE INSERT OR UPDATE ON animals
FOR EACH ROW
EXECUTE FUNCTION generate_animal_unique_hash();

-- Auto-create user profile on first access
CREATE OR REPLACE FUNCTION ensure_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (user_id)
  VALUES (NEW.user_id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get animal with all related data
CREATE OR REPLACE FUNCTION get_animal_with_stats(animal_uuid UUID)
RETURNS TABLE(
  animal_id UUID,
  name VARCHAR,
  species VARCHAR,
  status VARCHAR,
  adoption_status VARCHAR,
  total_images INT,
  total_likes INT,
  total_comments INT,
  total_memories INT,
  last_seen TIMESTAMP,
  days_since_seen INT,
  help_needed_count INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.name,
    a.species,
    a.status,
    a.adoption_status,
    (SELECT COUNT(*) FROM animal_images WHERE animal_id = a.id)::INT,
    (SELECT COUNT(*) FROM image_likes WHERE image_id IN (SELECT id FROM animal_images WHERE animal_id = a.id))::INT,
    (SELECT COUNT(*) FROM animal_comments WHERE animal_id = a.id AND NOT is_deleted)::INT,
    (SELECT COUNT(*) FROM emotional_memories WHERE animal_id = a.id)::INT,
    a.last_seen_at,
    (EXTRACT(DAY FROM now() - a.last_seen_at))::INT,
    (SELECT COUNT(*) FROM help_needed WHERE animal_id = a.id AND status = 'open')::INT
  FROM animals a
  WHERE a.id = animal_uuid;
END;
$$ LANGUAGE plpgsql;

-- Count likes for an image in real-time
CREATE OR REPLACE FUNCTION count_image_likes(image_uuid UUID)
RETURNS INT AS $$
  SELECT COUNT(*)::INT FROM image_likes WHERE image_id = image_uuid;
$$ LANGUAGE SQL;

-- ============================================================================
-- RLS POLICIES (Row Level Security)
-- ============================================================================

-- Enable RLS
ALTER TABLE animals ENABLE ROW LEVEL SECURITY;
ALTER TABLE animal_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE animal_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE adoption_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE help_needed ENABLE ROW LEVEL SECURITY;
ALTER TABLE emotional_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Animals are public read, authenticated write
CREATE POLICY "Animals public read" ON animals
  FOR SELECT
  USING (true);

CREATE POLICY "Animals authenticated write" ON animals
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Animals update own" ON animals
  FOR UPDATE
  USING (auth.uid() = created_by);

-- Images are public read, owner can manage
CREATE POLICY "Images public read" ON animal_images
  FOR SELECT
  USING (true);

CREATE POLICY "Images owner insert" ON animal_images
  FOR INSERT
  WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Images owner delete" ON animal_images
  FOR DELETE
  USING (auth.uid() = uploaded_by);

-- Comments are authenticated
CREATE POLICY "Comments public read" ON image_comments
  FOR SELECT
  USING (NOT is_deleted OR auth.uid() = user_id);

CREATE POLICY "Comments insert authenticated" ON image_comments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Comments own update" ON image_comments
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Comments own delete" ON image_comments
  FOR DELETE
  USING (auth.uid() = user_id);

-- Medical records authenticated read
CREATE POLICY "Medical records authenticated read" ON medical_records
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Medical records insert authenticated" ON medical_records
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Help needed public read
CREATE POLICY "Help needed public read" ON help_needed
  FOR SELECT
  USING (true);

CREATE POLICY "Help needed authenticated insert" ON help_needed
  FOR INSERT
  WITH CHECK (auth.uid() = reported_by);

-- Emotional memories public read
CREATE POLICY "Emotional memories public read" ON emotional_memories
  FOR SELECT
  USING (true);

CREATE POLICY "Emotional memories insert authenticated" ON emotional_memories
  FOR INSERT
  WITH CHECK (auth.uid() = shared_by);

-- ============================================================================
-- SCHEMA COMPLETE
-- ============================================================================
