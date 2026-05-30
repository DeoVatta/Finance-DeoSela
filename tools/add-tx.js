const { neon } = require("@neondatabase/serverless");

const connectionString =
  "postgresql://neondb_owner:npg_YBNt8jsaOr0b@ep-weathered-pond-ao1i0om3-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const sql = neon(connectionString);

async function addTransaction(tx) {
  const id = `tx-${Date.now()}`;
  const date = tx.date || new Date().toISOString().split("T")[0];

  await sql`
    INSERT INTO transactions (id, date, description, amount, category, type, wallet_id, note)
    VALUES (${id}, ${date}, ${tx.description}, ${Number(tx.amount)}, ${tx.category || "Uncategorized"}, ${tx.type || "expense"}, ${tx.walletId || null}, ${tx.note || ""})
  `;

  // Update wallet balance if linked
  if (tx.walletId) {
    const sign = tx.type === "income" ? "+" : "-";
    await sql`
      UPDATE wallets
      SET balance = balance ${sql.raw(sign)} ${Number(tx.amount)}
      WHERE id = ${tx.walletId}
    `;
  }

  const [result] = await sql`SELECT * FROM transactions WHERE id = ${id}`;
  return result;
}

// CLI usage
const [, , ...args] = process.argv;
if (args.length >= 3) {
  const tx = {
    description: args[0],
    amount: parseFloat(args[1]),
    category: args[2] || "Uncategorized",
    type: args[3] || "expense",
    walletId: args[4] || null,
    date: args[5] || null,
    note: args[6] || "",
  };

  addTransaction(tx)
    .then((r) => {
      console.log("✅ Transaction added:", r.id, r.description, r.amount);
      process.exit(0);
    })
    .catch((e) => {
      console.error("❌ Failed:", e.message);
      process.exit(1);
    });
} else {
  console.log("Usage: node add-tx.js <description> <amount> <category> [type] [walletId] [date] [note]");
  console.log("Example: node add-tx.js \"Makan siang\" 45000 \"Food & Groceries\" expense wallet-009");
  process.exit(1);
}
