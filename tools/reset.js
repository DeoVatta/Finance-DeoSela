// Finance reset — delete all transactions, reset wallet balances to 0
// Keeps: scheduled_expenses, all table structures intact
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_YBNt8jsaOr0b@ep-weathered-pond-ao1i0om3-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
});

async function main() {
  console.log('=== RESET FINANCE DATA ===\n');

  // 1. Delete all transactions
  const delTx = await pool.query('DELETE FROM transactions RETURNING id');
  console.log(`  Deleted ${delTx.rowCount} transactions`);

  // 2. Reset all wallet balances to 0
  const resetWallets = await pool.query('UPDATE wallets SET balance = 0 RETURNING name, owner');
  console.log(`  Reset ${resetWallets.rowCount} wallets to Rp0`);

  // Verify
  const wallets = await pool.query('SELECT name, balance, owner, type FROM wallets ORDER BY name');
  console.log('\n=== WALLETS AFTER RESET ===');
  wallets.rows.forEach(w => {
    console.log(`  ${w.name} (${w.owner}): Rp${parseFloat(w.balance).toLocaleString('id-ID')}`);
  });

  // Show scheduled expenses (kept)
  const sched = await pool.query('SELECT name, amount, day_of_month, active FROM scheduled_expenses ORDER BY day_of_month');
  console.log('\n=== SCHEDULED EXPENSES (KEPT) ===');
  sched.rows.forEach(s => {
    console.log(`  Tgl ${s.day_of_month}: ${s.name} Rp${parseFloat(s.amount).toLocaleString('id-ID')} [${s.active ? 'ACTIVE' : 'INACTIVE'}]`);
  });

  await pool.end();
  console.log('\n✅ Reset complete');
}

main().catch(e => { console.error(e); pool.end(); process.exit(1); });