// Daily Financial Report + Financial Advisor
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_YBNt8jsaOr0b@ep-weathered-pond-ao1i0om3-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
});

// Format rupiah
function rp(num) {
  return 'Rp' + parseFloat(num || 0).toLocaleString('id-ID');
}

// Days in month
function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

// Add days to date
function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

async function main() {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const todayDisplay = today.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  console.log(`=== 💰 LAPORAN KEUANGAN HARIAN ===`);
  console.log(`Tanggal: ${todayDisplay}\n`);

  // ── 1. WALLET BALANCES ──────────────────────────────────────────────
  const wallets = await pool.query(
    'SELECT name, balance, owner, type FROM wallets ORDER BY balance DESC'
  );
  const totalBalance = wallets.rows.reduce((sum, w) => sum + parseFloat(w.balance || 0), 0);

  console.log(`SALDO TOTAL: ${rp(totalBalance)}`);
  wallets.rows.forEach(w => {
    console.log(`  - ${w.name} ${w.owner ? `(${w.owner})` : ''}: ${rp(w.balance)}`);
  });
  console.log('');

  // ── 2. TODAY'S TRANSACTIONS ────────────────────────────────────────
  const todayTx = await pool.query(`
    SELECT t.category, t.type, t.amount, t.description, w.name as wallet_name
    FROM transactions t
    JOIN wallets w ON t.wallet_id = w.id
    WHERE t.date = $1
    ORDER BY t.type, t.category
  `, [todayStr]);

  const income = todayTx.rows.filter(t => t.type === 'income');
  const expense = todayTx.rows.filter(t => t.type === 'expense');

  const totalIncome = income.reduce((s, t) => s + parseFloat(t.amount), 0);
  const totalExpense = expense.reduce((s, t) => s + parseFloat(t.amount), 0);

  console.log(`PEMASUKAN HARI INI: ${rp(totalIncome)}`);
  if (income.length > 0) {
    income.forEach(t => {
      console.log(`  + ${t.description}: ${rp(t.amount)} [${t.wallet_name}]`);
    });
  } else {
    console.log(`  (tidak ada)`);
  }

  console.log(`\nPENGELUARAN HARI INI: ${rp(totalExpense)}`);
  if (expense.length > 0) {
    // Group by category
    const byCategory = {};
    expense.forEach(t => {
      const cat = t.category || 'Lainnya';
      byCategory[cat] = (byCategory[cat] || 0) + parseFloat(t.amount);
    });
    Object.entries(byCategory).forEach(([cat, amt]) => {
      console.log(`  - ${cat}: ${rp(amt)}`);
    });
    expense.forEach(t => {
      console.log(`    ${t.description}: ${rp(t.amount)}`);
    });
  } else {
    console.log(`  (tidak ada)`);
  }

  // ── 3. UPCOMING BILLS (7 days) ─────────────────────────────────────
  const sched = await pool.query(
    'SELECT name, amount, day_of_month, active FROM scheduled_expenses WHERE active = true ORDER BY day_of_month'
  );

  const currentDay = today.getDate();
  const daysInThisMonth = daysInMonth(today.getFullYear(), today.getMonth());

  const upcoming7 = sched.rows.filter(s => {
    const daysUntil = s.day_of_month >= currentDay
      ? s.day_of_month - currentDay
      : (daysInThisMonth - currentDay) + s.day_of_month;
    return daysUntil <= 7;
  });

  const upcomingAll = sched.rows.map(s => {
    const daysUntil = s.day_of_month >= currentDay
      ? s.day_of_month - currentDay
      : (daysInThisMonth - currentDay) + s.day_of_month;
    return { ...s, daysUntil };
  }).sort((a, b) => a.daysUntil - b.daysUntil);

  const totalUpcoming = sched.rows.reduce((s, r) => s + parseFloat(r.amount), 0);

  console.log(`\n\nTAGIHAN 7 HARI KEDEPAN:`);
  if (upcoming7.length > 0) {
    upcoming7.forEach(s => {
      const daysUntil = s.daysUntil;
      const label = daysUntil === 0 ? 'HARI INI' : daysUntil === 1 ? 'BESOK' : `${daysUntil} hari lagi`;
      console.log(`  - Tgl ${s.day_of_month}: ${s.name} ${rp(s.amount)} [${label}]`);
    });
  } else {
    console.log(`  (tidak ada tagihan 7 hari ke depan)`);
  }

  // ── 4. FINANCIAL ADVISOR ────────────────────────────────────────────
  console.log(`\n\n=== SARAN KEUANGAN ===`);

  const advice = [];

  // A. Daily budget calculation
  const remainingDaysInMonth = daysInThisMonth - currentDay + 1;
  const afterBills = totalBalance - totalUpcoming;

  if (totalUpcoming > 0) {
    const dailySaveForBills = Math.ceil(totalUpcoming / Math.max(remainingDaysInMonth, 1));
    advice.push({
      emoji: '📅',
      text: `Tagihan bulan ini Rp${totalUpcoming.toLocaleString('id-ID')}. Sisihkan minimal Rp${dailySaveForBills.toLocaleString('id-ID')}/hari untuk mencakup semua tagihan.`
    });

    if (afterBills > 0) {
      const dailySafe = Math.floor(afterBills / remainingDaysInMonth);
      advice.push({
        emoji: '💡',
        text: `Setelah sisihkan dana tagihan, budget harian yang aman: ${rp(dailySafe)}/hari (sisa ${remainingDaysInMonth} hari).`
      });
    } else {
      const neededDaily = Math.ceil(Math.abs(afterBills) / remainingDaysInMonth);
      advice.push({
        emoji: '🚨',
        text: `Saldo kurang Rp${Math.abs(afterBills).toLocaleString('id-ID')} untuk bayar tagihan. Perlu tambahan Rp${neededDaily.toLocaleString('id-ID')}/hari atau kurangi pengeluaran.`
      });
    }
  } else {
    const dailyBudget = Math.floor(totalBalance / Math.max(remainingDaysInMonth, 1));
    advice.push({
      emoji: '💡',
      text: `Tidak ada tagihan rutin. Budget harian: ${rp(dailyBudget)}/hari (sisa ${remainingDaysInMonth} hari).`
    });
  }

  // B. Today's spending vs daily budget
  const dailyBudget = Math.max(Math.floor(afterBills / remainingDaysInMonth), 0);
  if (totalExpense > 0 && dailyBudget > 0) {
    if (totalExpense > dailyBudget) {
      const overBy = totalExpense - dailyBudget;
      advice.push({
        emoji: '⚠️',
        text: `Pengeluaran hari ini ${rp(totalExpense)} sudah melebihi budget harian ${rp(dailyBudget)}. Lebih Rp${overBy.toLocaleString('id-ID')}. Coba kurangi besok ya!`
      });
    } else {
      const remaining = dailyBudget - totalExpense;
      advice.push({
        emoji: '✅',
        text: `Pengeluaran hari ini ${rp(totalExpense)}, masih dalam budget. Sisa budget hari ini: ${rp(remaining)}.`
      });
    }
  }

  // C. Bill readiness check
  const billWarnings = upcomingAll.filter(s => parseFloat(s.amount) > totalBalance);
  if (billWarnings.length > 0) {
    const nearest = billWarnings[0];
    advice.push({
      emoji: '🔴',
      text: `Saldo tidak cukup untuk "${nearest.name}" (${rp(nearest.amount)}) tanggal ${nearest.day_of_month}. Mulai sisihkan sekarang!`
    });
  }

  // D. Consumables / pantry low stock
  try {
    const lowConsumables = await pool.query(`
      SELECT name, quantity, unit, estimated_days, min_stock,
             (last_purchased::date + (estimated_days * quantity) * interval '1 day')::date as est_depletion
      FROM consumables
      WHERE active = true
        AND (quantity <= min_stock OR (last_purchased::date + (estimated_days * quantity) * interval '1 day') <= CURRENT_DATE + 7)
      ORDER BY est_depletion
    `);

    if (lowConsumables.rows.length > 0) {
      advice.push({
        emoji: '🛒',
        text: `Stok yang perlu di-restok: ${lowConsumables.rows.map(r => `${r.name} (${r.quantity} ${r.unit})`).join(', ')}.`
      });
    }
  } catch (e) {
    // consumables table may not exist
  }

  try {
    const lowPantry = await pool.query(
      "SELECT name, quantity, unit FROM pantry_items WHERE quantity > 0 AND quantity <= 1 ORDER BY quantity"
    );
    if (lowPantry.rows.length > 0) {
      advice.push({
        emoji: '🥘',
        text: `Stok pantry menipis: ${lowPantry.rows.map(r => `${r.name} (${r.quantity} ${r.unit})`).join(', ')}.`
      });
    }
  } catch (e) {
    // pantry table may not exist
  }

  // E. Savings / surplus opportunity
  if (afterBills > 0 && totalExpense <= dailyBudget) {
    const surplus = afterBills - (dailyBudget * remainingDaysInMonth);
    if (surplus > 500000) {
      advice.push({
        emoji: '💰',
        text: `Saldo aman! Bisa sisihkan ${rp(Math.floor(surplus * 0.5))} untuk dana darurat atau investasi.`
      });
    }
  }

  // F. Month-end buffer
  if (remainingDaysInMonth <= 5) {
    advice.push({
      emoji: '📆',
      text: `Hanya剩 ${remainingDaysInMonth} hari lagi bulan ini. Pastikan saldo cukup sampai gajian!`
    });
  }

  // Print all advice
  if (advice.length === 0) {
    advice.push({
      emoji: '✅',
      text: `Tidak ada masalah terdeteksi. Keuangan aman!`
    });
  }
  advice.forEach(a => console.log(`  ${a.emoji} ${a.text}`));

  // ── 5. FULL MONTH SCHEDULE ─────────────────────────────────────────
  if (sched.rows.length > 0) {
    console.log(`\n\n=== JADWAL BULAN INI ===`);
    upcomingAll.forEach(s => {
      const label = s.daysUntil === 0 ? 'HARI INI' : s.daysUntil === 1 ? 'BESOK' : `${s.daysUntil} hari`;
      console.log(`  Tgl ${String(s.day_of_month).padStart(2,'0')}: ${s.name} ${rp(s.amount)} — ${label}`);
    });
  }

  await pool.end();
  console.log(`\n\nGenerated: ${new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}`);
}

main().catch(e => { console.error(e); pool.end(); process.exit(1); });