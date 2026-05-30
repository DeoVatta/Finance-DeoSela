const { Pool } = require("pg");

const connectionString =
  "postgresql://neondb_owner:npg_YBNt8jsaOr0b@ep-weathered-pond-ao1i0om3-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const pool = new Pool({ connectionString });

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
  console.log("Connecting to Neon...");
  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log("✅ Tables created successfully!");

    // Seed wallets
    const wallets = [
      ["wallet-001", "Seabank Deo", "Deo", "bank", 2500000, "🏦", "#3B82F6"],
      ["wallet-002", "Seabank Sela", "Sela", "bank", 1800000, "🏦", "#EC4899"],
      ["wallet-003", "BCA", "Deo", "bank", 5000000, "🏛️", "#10B981"],
      ["wallet-004", "Dana Deo", "Deo", "e-wallet", 350000, "💳", "#8B5CF6"],
      ["wallet-005", "Dana Sela", "Sela", "e-wallet", 200000, "💳", "#F59E0B"],
      ["wallet-006", "ShopeePay Deo", "Deo", "e-wallet", 150000, "🛍️", "#EF4444"],
      ["wallet-007", "ShopeePay Valmira", "Valmira", "e-wallet", 100000, "🛍️", "#F97316"],
      ["wallet-008", "GoPay Ansela", "Ansela", "e-wallet", 275000, "💚", "#4ADE80"],
      ["wallet-009", "Cash", "Bersama", "cash", 500000, "💵", "#6B7280"],
    ];

    for (const w of wallets) {
      await client.query(
        `INSERT INTO wallets (id, name, owner, type, balance, icon, color)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (id) DO NOTHING`,
        w
      );
    }
    console.log("✅ Wallets seeded!");

    // Seed transactions
    const transactions = [
      ["tx-001", "2026-05-28", "Groceries - Superindo", 285000, "Food & Groceries", "expense", "wallet-001", "Weekly belanja"],
      ["tx-002", "2026-05-28", "Gaji Bulanan", 5000000, "Income", "income", "wallet-003", "Gaji Mei"],
      ["tx-003", "2026-05-29", "Nonton bareng", 75000, "Entertainment", "expense", "wallet-008", "Bioskop XXI"],
      ["tx-004", "2026-05-29", "Bensin", 100000, "Transportation", "expense", "wallet-008", "Full tank Pertamax"],
      ["tx-005", "2026-05-30", "Makan siang", 45000, "Food & Groceries", "expense", "wallet-009", "Ayam geprek"],
    ];

    for (const t of transactions) {
      await client.query(
        `INSERT INTO transactions (id, date, description, amount, category, type, wallet_id, note)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (id) DO NOTHING`,
        t
      );
    }
    console.log("✅ Transactions seeded!");

    // Verify
    const { rows: walCount } = await client.query("SELECT COUNT(*) FROM wallets");
    const { rows: txCount } = await client.query("SELECT COUNT(*) FROM transactions");
    console.log(`📊 ${txCount[0].count} transactions, ${walCount[0].count} wallets ready`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("❌ Failed:", err.message);
  process.exit(1);
});
