const url = "https://fuiytcxdhjavbklbptqk.supabase.co/rest/v1";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1aXl0Y3hkaGphdmJrbGJwdHFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0NjA5NTIsImV4cCI6MjA5ODAzNjk1Mn0.PuT4pvmM-GCYQXayB0fTnTRBAgQQM2qOAWNPic_g5Tg";

async function run() {
  const headers = {
    "apikey": key,
    "Authorization": `Bearer ${key}`,
    "Content-Type": "application/json"
  };

  const res = await fetch(`${url}/profiles?email=eq.super@facilityops.test&select=*`, { headers });
  const profiles = await res.json();
  console.log("Super Admin profile in DB:", JSON.stringify(profiles, null, 2));
}

run();
