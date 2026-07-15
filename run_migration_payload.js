import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envText = fs.readFileSync('.env', 'utf-8');
const env = {};
envText.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL || 'https://fuiytcxdhjavbklbptqk.supabase.co';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log('Logging in as super@facilityops.test...');
  const { data: auth, error: authError } = await supabase.auth.signInWithPassword({
    email: 'super@facilityops.test',
    password: 'demo123'
  });

  if (authError) {
    console.error('Login Failed:', authError);
    return;
  }

  const sql = `
    CREATE OR REPLACE FUNCTION public.get_public_companies()
    RETURNS TABLE (id UUID, name TEXT) AS $$
    BEGIN
        RETURN QUERY SELECT c.id, c.name FROM public.companies c ORDER BY c.name ASC;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    GRANT EXECUTE ON FUNCTION public.get_public_companies() TO anon, authenticated;
  `;
  console.log('Executing SQL migration on Supabase via RPC...');
  const { data, error } = await supabase.rpc('exec_sql', { sql });
  if (error) {
    console.error('SQL Execution Error:', error);
    process.exit(1);
  } else {
    console.log('SQL Migration executed successfully:', data);
  }
}

run();
