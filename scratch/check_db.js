const url = "https://fuiytcxdhjavbklbptqk.supabase.co/rest/v1";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1aXl0Y3hkaGphdmJrbGJwdHFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0NjA5NTIsImV4cCI6MjA5ODAzNjk1Mn0.PuT4pvmM-GCYQXayB0fTnTRBAgQQM2qOAWNPic_g5Tg";

async function run() {
  const headers = {
    "apikey": key,
    "Authorization": `Bearer ${key}`,
    "Content-Type": "application/json"
  };

  console.log("=== Querying PANTRY_ITEM_NAMES ===");
  const defsRes = await fetch(`${url}/master_definitions?master_key=eq.PANTRY_ITEM_NAMES&select=*,master_values(*)`, { headers });
  const defs = await defsRes.json();
  console.log("PANTRY_ITEM_NAMES definition in DB:", JSON.stringify(defs, null, 2));
}

run();
