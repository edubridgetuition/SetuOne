const { createClient } = require('@supabase/supabase-js');

const url = "https://fuiytcxdhjavbklbptqk.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1aXl0Y3hkaGphdmJrbGJwdHFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0NjA5NTIsImV4cCI6MjA5ODAzNjk1Mn0.PuT4pvmM-GCYQXayB0fTnTRBAgQQM2qOAWNPic_g5Tg";
const supabase = createClient(url, key);

async function run() {
  const { data: companies } = await supabase.from('companies').select('id');
  const companyId = companies[0]?.id;
  
  if (!companyId) {
    console.error("No company found.");
    return;
  }
  
  console.log("Using Company ID:", companyId);
  
  // Try to insert PANTRY_ITEM_NAMES definition
  const { data: def, error: defErr } = await supabase
    .from('master_definitions')
    .insert({
      company_id: companyId,
      master_key: 'PANTRY_ITEM_NAMES',
      master_name: 'Pantry Item Names'
    })
    .select();
    
  console.log("Def Insert Result:", def, "Error:", defErr);
}

run();
