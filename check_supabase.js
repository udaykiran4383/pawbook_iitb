const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://wrwxjfujnmudcqsmvcvj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indyd3hqZnVqbm11ZGNxc212Y3ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzI2ODE0MywiZXhwIjoyMDkyODQ0MTQzfQ.nUUYh-Bfx-NmtI0s7qVf10oF3y5Fu07jok5bELTjzQc';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('animals').select('*').limit(1);
  console.log("animals:", error ? error.message : "Exists");
  const { data: d2, error: e2 } = await supabase.from('user_profiles').select('*').limit(1);
  console.log("user_profiles:", e2 ? e2.message : "Exists");
}
check();
