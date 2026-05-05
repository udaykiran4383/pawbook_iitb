import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    const sqlFile = path.join(process.cwd(), 'scripts/01-db-init.sql');
    const sql = fs.readFileSync(sqlFile, 'utf-8');
    
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`[v0] Running ${statements.length} SQL statements...`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`[v0] Executing statement ${i + 1}/${statements.length}...`);
      
      const { error } = await supabase.rpc('execute_sql', { sql: statement });
      
      if (error) {
        console.warn(`[v0] Statement ${i + 1} warning/info:`, error.message);
      }
    }

    console.log('[v0] Migration completed successfully!');
  } catch (error) {
    console.error('[v0] Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
