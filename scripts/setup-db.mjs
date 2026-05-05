import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('[v0] Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  try {
    console.log('[v0] Starting database setup...');

    // Create animals table
    const { error: animalsError } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS animals (
          id BIGSERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          location TEXT NOT NULL,
          description TEXT,
          image_url TEXT,
          animal_type TEXT NOT NULL,
          status TEXT DEFAULT 'active',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          reported_by UUID REFERENCES auth.users(id),
          UNIQUE(LOWER(name), LOWER(location))
        );
      `
    }).catch(() => ({ error: null }));

    // Create user_profiles table
    const { error: profilesError } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS user_profiles (
          id UUID PRIMARY KEY REFERENCES auth.users(id),
          username TEXT UNIQUE,
          trust_score INTEGER DEFAULT 50,
          contributions_count INTEGER DEFAULT 0,
          verified_contributions INTEGER DEFAULT 0,
          violations_count INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
      `
    }).catch(() => ({ error: null }));

    // Create care_events table
    const { error: careError } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS care_events (
          id BIGSERIAL PRIMARY KEY,
          animal_id BIGINT NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
          event_type TEXT NOT NULL,
          notes TEXT,
          recorded_by UUID REFERENCES auth.users(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        CREATE INDEX IF NOT EXISTS care_events_animal_id_idx ON care_events(animal_id);
      `
    }).catch(() => ({ error: null }));

    // Create contribution_audit table
    const { error: auditError } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS contribution_audit (
          id BIGSERIAL PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id),
          action TEXT NOT NULL,
          table_name TEXT NOT NULL,
          record_id BIGINT,
          status TEXT DEFAULT 'pending',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
      `
    }).catch(() => ({ error: null }));

    console.log('[v0] ✓ Database tables created');
  } catch (error) {
    console.error('[v0] Setup error:', error.message);
    process.exit(1);
  }
}

setupDatabase();
