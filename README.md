# Solar Khata ⚡ — Advance Ledger System

An offline-first, installable mobile app (PWA) for solar & inverter businesses: daily khata, per-person advance accounts, inventory with smart low-stock alarms, invoicing with auto advance deduction, returns, discounts and Google Drive backup/sync.

## Run it

**Option A — double-click** `index.html` (works, but no PWA install / Google Drive / fingerprint — the browser blocks those on `file://`).

**Option B — local server (recommended):**

```bash
cd solar-khata
python -m http.server 8080     # or:  npx serve .
```

Open `http://localhost:8080` on your phone/desktop → browser menu → **"Install app" / "Add to Home Screen"**. After the first load it works fully offline.

**Option C — host it** on any static host (GitHub Pages, Netlify…) over HTTPS so every device you own can install it and sync through Google Drive.

## Features

| Area | What you get |
|---|---|
| **Smart login** | Owner account (hashed password), quick 4–6 digit PIN unlock, optional fingerprint/Face unlock (WebAuthn), manual + auto lock |
| **Inventory** | Panels, inverters, batteries… with SKU, unit, cost & sale price, categories, archived items, full stock movement history (opening, purchases, sales, returns, adjustments) |
| **Smart stock alarms** | Per-item low-stock threshold (set individually for every item) — red badges, dashboard alert card, daily system notifications |
| **Daily khata** | Day-by-day book: sales, payments, advances, returns, discounts, expenses + net cash |
| **Person khata** | Every customer's full account detail with running balance, opening balances, editable entries, printable statement |
| **Invoices** | Line items from inventory or custom lines, invoice-level discount with note, due dates, auto numbering (INV-0001…), print/PDF, WhatsApp share |
| **Advance system** | Advance pool per customer, **auto-deducted** from new bills (toggleable), shown live while billing |
| **Dues & discounts** | Overdue detection, top-dues dashboard chips, discount entries in khata |
| **Returns** | Full or partial returns against any invoice — stock goes back in, customer balance credited |
| **Backup & sync** | 1-tap JSON export/import (merge = newest-wins global sync, or replace) + Google Drive auto backup every 24h |
| **Offline** | Service worker caches the whole app; all data lives in IndexedDB on the device |
| **UI/UX** | Mobile-first, dark/light theme, bottom tabs, bottom sheets, toasts, charts |

## Google Drive backup setup (one-time)

The app backs up into your private Drive **app data folder** (invisible, only Solar Khata can read it). You need a free OAuth Client ID:

1. Go to https://console.cloud.google.com → create/select a project.
2. **APIs & Services → Library** → enable **Google Drive API**.
3. **APIs & Services → OAuth consent screen** → External → add yourself as test user (or publish).
4. **Credentials → Create credentials → OAuth client ID** → type **Web application**.
5. Add your origin to **Authorized JavaScript origins**, e.g. `http://localhost:8080` or `https://yourapp.netlify.app`.
6. Copy the Client ID (`…apps.googleusercontent.com`) → Solar Khata → **Settings → Backup & global sync → paste → Connect**.

Sync across devices: enable *Daily auto-backup* on the main phone; on other devices use **Restore from Drive → Merge**. Newest change wins per record.

## For staff / developers

```bash
git clone https://github.com/inehatech-svg/solar-khata.git
cd solar-khata
npm start          # runs the app at http://localhost:8123  (needs Node.js)
```

That's it — the app has zero build step and zero npm dependencies. Edit any file, refresh the browser.

**Deploying an update** (only for accounts with Firebase access):

```bash
npm install -g firebase-tools   # one time
firebase login                  # one time
npm run deploy
```

Please test locally (`npm start`) before deploying — deployed updates reach every phone using the app.

## Migrating from Digi Khata (or Udhaar Book / Okkhata)

**Settings → Import customers & inventory** accepts:

- **Excel (.xlsx) / CSV** — the most accurate. In Digi Khata: open the report → Share → Excel, then upload it here.
- **PDF report** — best-effort (reads names, phones and balances out of the report text).
- **Paste** — copy rows straight from a spreadsheet and paste them.

Column names are auto-detected (Name, Phone, Balance, Qty, Price…) and you can remap them before importing. Positive balances become dues the customer owes; negative (or "Cr") balances become advances. Duplicate customers (same phone/name) and items (same name) are skipped. Download the in-app templates to see the exact format.

## Data & privacy

Everything is stored locally (IndexedDB). Nothing is sent anywhere unless you explicitly connect Google Drive. Export a JSON backup regularly and keep it somewhere safe — the "Erase all data" action cannot be undone.

## Tips

- Print an invoice → choose "Save as PDF" in the print dialog for a PDF copy.
- Use **Adjust** on an item for damage/loss/recounts; use **Add stock** for purchases (it can also update the cost price).
- Set each item's alarm threshold when creating it — default for new items is configurable in Settings.
