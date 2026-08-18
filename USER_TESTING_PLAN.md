# StellarSyndicate — User Testing Plan (Level 4 MVP)

> **Audience:** 10 student testers with no prior Stellar / Web3 experience  
> **Environment:** Stellar Testnet  
> **App URL:** [https://stellarsyndicate-main.vercel.app](https://stellarsyndicate-main.vercel.app)  
> **Estimated Session Time:** 25–35 minutes per tester

---

## Part 1 — Tester Onboarding Guide

Follow every step in order. Do not skip to the next step until the current one is confirmed.

---

### Step 1 — Install the Freighter Wallet Extension

Freighter is the official Stellar browser wallet, similar to MetaMask for Ethereum.

1. Open **Google Chrome** or **Brave** (Firefox also works).
2. Navigate to [https://www.freighter.app](https://www.freighter.app) or search the **Chrome Web Store** for "Freighter Wallet".
3. Click **Add to Chrome** → **Add Extension**.
4. Once installed, the Freighter icon ( 🔷 ) will appear in your browser's extension bar.
   > If you don't see it, click the puzzle-piece icon (🧩) in Chrome and pin Freighter.
5. Click the Freighter icon to open it.
6. Select **"Create new wallet"** (if you already have a Stellar account, choose "Import").
7. Write down your **12-word seed phrase** on paper and store it safely. This is the only way to recover your wallet.
8. Set a strong wallet password and confirm it.
9. Click **"Done"**.

**Checkpoint ✅:** You should see a Freighter popup showing your public Stellar address (starts with `G`).

---

### Step 2 — Switch Freighter to Stellar Testnet

The app runs on the Stellar **Testnet**, a free sandbox environment. Real XLM is not used.

1. Open Freighter by clicking its extension icon.
2. Click the **network selector** (top-right — it likely shows "Mainnet" or a chain icon).
3. Select **"Testnet"** from the dropdown.
4. Confirm — the indicator should now show **TESTNET** in the Freighter header.

**Checkpoint ✅:** Freighter header shows `TESTNET` and your balance is 0 XLM.

---

### Step 3 — Fund Your Testnet Account with Friendbot

Testnet XLM is free and used only for testing. "Friendbot" is Stellar's official faucet.

**Method A (Friendbot website — easiest):**

1. Copy your public key from Freighter (click your address at the top).
2. Visit [https://friendbot.stellar.org](https://friendbot.stellar.org).
3. Paste your address into the input field and click **"Get test lumens"**.
4. You should see a success JSON response.
5. Return to Freighter — your balance should now show **10,000 XLM**.

**Method B (Stellar Laboratory):**

1. Go to [https://laboratory.stellar.org/#account-creator?network=test](https://laboratory.stellar.org/#account-creator?network=test).
2. Paste your public key and click **"Get test network lumens"**.

> ⚠️ **Note:** Testnet XLM has no real monetary value. Never send your seed phrase to anyone.

**Checkpoint ✅:** Freighter shows a balance of **10,000 XLM** on Testnet.

---

### Step 4 — Connect Your Wallet to StellarSyndicate

1. Open [https://stellarsyndicate-main.vercel.app](https://stellarsyndicate-main.vercel.app) in the same browser where Freighter is installed.
2. On the landing page, click **"Connect Wallet"** in the top-right navigation bar.
3. A wallet selection modal will appear — choose **"Freighter"**.
4. Freighter will pop up asking for permission to connect — click **"Connect"**.
5. The Navbar should now show your truncated public key (e.g. `GBLCEL...ABIYQ`) and your XLM balance.

**Checkpoint ✅:** Your wallet address and balance are visible in the Navbar.

---

### Step 5 — Create a Purchasing Syndicate

1. Click **"Dashboard"** in the top navigation.
2. Click the **"New Syndicate"** button (top-right of the dashboard).
3. Fill in the form:
   - **Group Title:** e.g. `"Campus Coffee Bean Import"`
   - **Description:** e.g. `"10 students pooling to buy 50kg of Colombian coffee beans at wholesale price."`
   - **Total Units Target:** e.g. `50`
4. Click **"Initialize On-Chain Group"**.
5. Freighter will popup asking you to sign a transaction — review it and click **"Approve"**.
6. Wait for the **transaction confirmation overlay** to show a green ✅ success state with a TX hash.
7. Click **"Close"** — you will be redirected to the Dashboard.

**Checkpoint ✅:** Your new syndicate card appears on the Dashboard with status `Open`.

---

### Step 6 — Add a Member to the Syndicate

1. From the Dashboard, click on your newly created syndicate card.
2. In the **"Register Member On-Chain"** form (left column), enter:
   - **Name:** Your name or a test name (e.g. `Alice Buyer`)
   - **Stellar Public Key:** Your own public key, or a classmate's key
   - **Order Units:** e.g. `5`
3. Click **"Submit On-Chain Transaction"**.
4. Approve the Freighter popup.
5. Confirm the transaction success overlay appears.

**Checkpoint ✅:** The member card appears in the Members list with status `Unpaid`.

---

### Step 7 — Log a Shared Expense

1. On the same Group Details page, find the **"Add Expense Invoice"** form (right column).
2. Enter:
   - **Description:** e.g. `"FedEx International Shipping"`
   - **Amount:** e.g. `100`
   - **Type:** `Split Equally` (fixed cost) or `Split by Volume` (proportional to order size)
3. Click **"Log Expense"**.

**Checkpoint ✅:** The expense appears in the list and the **Settlement Cards** section below shows each member's calculated share.

---

### Step 8 — Settle Your Payment On-Chain

> This step is only available if the connected wallet address matches a registered member.

1. Scroll down to the **"Co-op Cost Settlement Cards"** section.
2. Find your member card — it shows your **Fixed Share**, **Volume Share**, and **Total Owed**.
3. Click **"Settle & Pay X.XX XLM"** on your card.
4. Freighter will show a signing prompt for the Soroban contract invocation — click **"Approve"**.
5. Wait for the success overlay with the on-chain TX hash.
6. Your member card will update to show a green **"Paid"** badge.

**Checkpoint ✅:** Settlement card shows the green `Paid` badge and the on-chain event feed shows the `mark_paid` event.

---

### Step 9 — Verify on Stellar Expert

1. Copy the TX hash from any of the confirmation overlays.
2. Visit: `https://stellar.expert/explorer/testnet/tx/<YOUR_TX_HASH>`
3. Confirm the transaction was accepted on the Testnet ledger.

**Checkpoint ✅:** Stellar Expert shows the transaction with status `success`.

---

## Part 2 — Tester Feedback Template

After completing the test session, each tester fills in the following 3 questions.

---

**Tester Name / ID:** ___________________________  
**Date of Test:** ___________________________  
**Wallet Address (first 6 chars):** `G` _______________

---

### Question 1 — Usability

> *On a scale of 1–5 (1 = very confusing, 5 = very easy), how easy was it to complete the full payment flow from wallet setup to on-chain settlement?*

**Rating (circle one):** &nbsp; 1 &nbsp;&nbsp; 2 &nbsp;&nbsp; 3 &nbsp;&nbsp; 4 &nbsp;&nbsp; 5

**Comments (what was confusing or smooth?):**

```
___________________________________________________________________________

___________________________________________________________________________

___________________________________________________________________________
```

---

### Question 2 — Trust & Transparency

> *After completing the test, did seeing your transaction appear on Stellar Expert (the blockchain explorer) change how much you trust the payment settlement? Please explain why or why not.*

**Answer:**

```
___________________________________________________________________________

___________________________________________________________________________

___________________________________________________________________________
```

---

### Question 3 — Real-World Applicability

> *Imagine your campus canteen wanted to bulk-order ingredients from a wholesale supplier. Would StellarSyndicate be a useful tool for this? What one feature would you add to make it more compelling?*

**Answer:**

```
___________________________________________________________________________

___________________________________________________________________________

___________________________________________________________________________
```

---

## Facilitator Progress Checklist

| Tester # | Wallet Funded? | Group Created? | Member Added? | Payment Settled? | Feedback Collected? |
|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | ☐ | ☐ | ☐ | ☐ | ☐ |
| 2 | ☐ | ☐ | ☐ | ☐ | ☐ |
| 3 | ☐ | ☐ | ☐ | ☐ | ☐ |
| 4 | ☐ | ☐ | ☐ | ☐ | ☐ |
| 5 | ☐ | ☐ | ☐ | ☐ | ☐ |
| 6 | ☐ | ☐ | ☐ | ☐ | ☐ |
| 7 | ☐ | ☐ | ☐ | ☐ | ☐ |
| 8 | ☐ | ☐ | ☐ | ☐ | ☐ |
| 9 | ☐ | ☐ | ☐ | ☐ | ☐ |
| 10 | ☐ | ☐ | ☐ | ☐ | ☐ |

---

## Common Issues & Resolutions

| Issue | Resolution |
|---|---|
| "Freighter not installed" shown on connect | Ensure Freighter extension is installed; do not use incognito mode |
| Balance shows `0.0000 (Unfunded)` | Re-run Friendbot with the correct public key |
| Transaction rejected in Freighter | Ensure the wallet is on **Testnet**, not Mainnet |
| `mark_paid` fails | Ensure the connected wallet address matches the registered member address |
| Group doesn't appear after creation | Click **Manual Sync** on the Group Details page to re-query the Soroban RPC |
| Settlement cards not visible | At least one expense must be logged before settlement cards are displayed |
