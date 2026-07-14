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
  const { data: companies } = await supabase.from('companies').select('*');
  console.log('Companies:', companies);

  const { data: profiles } = await supabase.from('profiles').select('*');
  console.log('Profiles:', profiles);

  const { data: roles } = await supabase.from('roles').select('*');
  console.log('Roles:', roles);
}

run();
