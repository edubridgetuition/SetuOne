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

async function checkTable(tableName) {
  const { data, error } = await supabase.from(tableName).select('*').limit(1);
  if (error) {
    console.log(`Table ${tableName}: ❌ Error: ${error.message}`);
  } else {
    console.log(`Table ${tableName}:  Columns:`, Object.keys(data[0] || {}));
  }
}

async function run() {
  await checkTable('purchase_requests');
  await checkTable('purchase_request_items');
  await checkTable('vendors');
  await checkTable('quotations');
  await checkTable('quotation_items');
  await checkTable('purchase_orders');
  await checkTable('grns');
  await checkTable('grn_items');
}

run();
