const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://qjemyvydivekolywleji.supabase.co",
  "***"
);

const sql = `
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  category TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income','expense')),
  wallet_id TEXT,
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  owner TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('bank','e-wallet','cash')),
  balance NUMERIC(15,2) NOT NULL DEFAULT 0,
  icon TEXT DEFAULT '💰',
  color TEXT DEFAULT '#6B7280',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
`;

async function main() {
  const { error } = await supabase.rpc("exec_sql", { query: sql });
  if (error) {
    // exec_sql might not exist, try direct table creation via insert with return
    console.log("RPC not available, trying direct table check...");
    
    // Check if wallets table exists by doing a select
    const { data: wallets, error: walErr } = await supabase.from("wallets").select("id").limit(1);
    if (walErr && walErr.code === "42P01") {
      console.log("Tables don't exist yet. Need to create them via Supabase dashboard SQL editor.");
      console.log("Please run this SQL in Supabase SQL Editor:\n");
      console.log(sql);
      return;
    }
    console.log("Tables exist:", walErr ? walErr.message : "OK");
    return;
  }
  console.log("Tables created successfully!");
}

main().catch(console.error);
