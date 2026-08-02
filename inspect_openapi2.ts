import { createClient } from "@supabase/supabase-js";
const SUPABASE_URL = process.env.SUPABASE_URL || "https://mock.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "mock-key";

async function run() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    headers: {
      "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
      "apikey": SUPABASE_SERVICE_KEY
    }
  });
  const data = await res.json();
  const schema = data.definitions['files'];
  console.log("kind:", schema.properties.kind);
  console.log("permission:", schema.properties.permission);
}
run();
