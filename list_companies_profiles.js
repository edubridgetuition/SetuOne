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

  console.log('Login successful. Querying companies...');
  const { data: companies, error: coError } = await supabase.from('companies').select('*');
  console.log('Companies:', companies, coError);

  const { data: profiles, error: prError } = await supabase.from('profiles').select('*');
  console.log('Profiles count:', profiles ? profiles.length : 0, prError);
  console.log('First 5 Profiles:', profiles ? profiles.slice(0, 5) : []);

  const { data: roles } = await supabase.from('roles').select('*');
  console.log('Roles:', roles);
}

run();
