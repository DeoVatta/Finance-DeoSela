# Finance DeoSela - Neon Database

## Connection
**Database:** Neon (PostgreSQL)
**URL:** stored in `finance-deosela/tools/db-url.txt` and `TOOLS.md`

## Tables
- `transactions` — id, date, description, amount, category, type, wallet_id, note
- `wallets` — id, name, owner, type, balance, icon, color

## Adding Transactions
```bash
node /path/to/finance-deosela/tools/add-tx.js <desc> <amount> <category> <type> <walletId> [date] [note]
```

## Wallet IDs
| ID | Nama | Owner |
|----|------|-------|
| wallet-001 | Seabank Deo | Deo |
| wallet-002 | Seabank Sela | Sela |
| wallet-003 | BCA | Deo |
| wallet-004 | Dana Deo | Deo |
| wallet-005 | Dana Sela | Sela |
| wallet-006 | ShopeePay Deo | Deo |
| wallet-007 | ShopeePay Valmira | Valmira |
| wallet-008 | GoPay Ansela | Ansela |
| wallet-009 | Cash | Bersama |
