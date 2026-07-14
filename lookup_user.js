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
  const { data: profiles, error } = await supabase.from('profiles').select('id, full_name, email, company_id').limit(15);
  if (error) {
    console.error('Error fetching users:', error);
  } else {
    console.log('All Profiles:', profiles);
  }
}

run();
