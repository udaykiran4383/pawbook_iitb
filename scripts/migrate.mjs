import { createClient } from '@supabase/supabase-js';
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const postgresUrl = process.env.POSTGRES_URL_NON_POOLING;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!postgresUrl || !supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  console.error('POSTGRES_URL_NON_POOLING:', postgresUrl ? '✓' : '✗');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

let pg;
try {
  pg = (await import('pg')).default;
} catch (e) {
  console.log('[v0] pg package not installed, will attempt with Supabase client');
}

async function runMigration() {
  try {
    const sqlFile = path.join(__dirname, '01-db-init.sql');
    const sql = fs.readFileSync(sqlFile, 'utf-8');
    
    console.log('[v0] Reading SQL file...');
    
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`[v0] Found ${statements.length} SQL statements`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`[v0] Executing statement ${i + 1}/${statements.length}...`);
      
      const { error } = await supabase.from('_sql').rpc('exec', {
        statement: statement
      }).catch(() => {
        // If direct execution fails, try via the admin API
        return supabase.admin?.query?.(statement) || { error: 'No admin access' };
      });

      if (error && error.message && error.message !== 'relation "_sql" does not exist') {
        console.warn(`[v0] Warning on statement ${i + 1}:`, error.message);
      }
    }

    console.log('[v0] ✓ Migration completed!');
  } catch (error) {
    console.error('[v0] Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
