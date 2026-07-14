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
  const sql = `
    ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS address TEXT;
    ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS gst TEXT;
    ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS owner_name TEXT;
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
