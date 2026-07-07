const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debug() {
  console.log("Fetching companies...");
  const { data: companies } = await supabase.from('companies').select('*');
  console.log("Companies:", companies);

  console.log("\nFetching master_definitions...");
  const { data: defs } = await supabase.from('master_definitions').select('*');
  console.log("Definitions:", defs);

  console.log("\nFetching master_values...");
  const { data: vals } = await supabase.from('master_values').select('*');
  console.log("Values:", vals);
}

debug();
