# StellarSyndicate

StellarSyndicate is a decentralized bulk-buy and co-op purchasing application designed to help small businesses and communities pool resources to access wholesale prices, leveraging the Stellar network for fast, low-cost settlements.

## Live Demo & Contracts
* **Live Demo URL:** [https://stellarsyndicate.vercel.app](https://stellarsyndicate.vercel.app)
* **Deployed Soroban Contract Address:** [CBFQ6FBVOSYZWSTXXPQVDNHR3H7LYOAQVHAHHJGMWSFUZNXZ4Z7L2GTY](https://stellar.expert/explorer/testnet/contract/CBFQ6FBVOSYZWSTXXPQVDNHR3H7LYOAQVHAHHJGMWSFUZNXZ4Z7L2GTY)
* **Successful Contract Call Tx Hash:** [cebc1786fd5698036121badde80858dfe10b6c9ad8877ff1dd5559a0b527e91f](https://stellar.expert/explorer/testnet/tx/cebc1786fd5698036121badde80858dfe10b6c9ad8877ff1dd5559a0b527e91f)

---

## Features
* **Multi-Wallet Support:** Uses `StellarWalletsKit` to seamlessly connect Freighter, Albedo, and xBull wallets on the Stellar Testnet.
* **XLM Balance Tracker:** Automatically fetches and displays the connected account's XLM balance.
* **On-Chain Syndicate Registration:** Creates co-op groups, adds members, and records payment settlements directly on the Soroban smart contract.
* **Dual Payment & Settlement Flow:** Sends native XLM payments to the Lead Buyer and automatically writes the payment confirmation status on-chain.
* **Real-time State Syncing:** Listens to contract events and polls the Stellar ledger for state changes to update the UI instantly.
* **Modern Glassmorphism UI:** Responsive dark theme optimized for desktop and mobile viewports.
* **Robust Error Handling:** Detects and guides users on wallet availability, user transaction rejection, and insufficient XLM balance.

---

## Tech Stack
* **Frontend:** React, TypeScript, Vite, Framer Motion
* **Styling:** TailwindCSS, Lucide Icons
* **Stellar Integration:** `@creit.tech/stellar-wallets-kit`, `@stellar/stellar-sdk`
* **Smart Contract Platform:** Soroban, Rust

---

## Folder Structure
```text
stellarsyndicate/
├── kunal-contract/      # Soroban Smart Contract (Rust)
│   ├── src/
│   │   └── lib.rs       # Contract implementation (LumenGuildContract)
│   └── Cargo.toml
├── src/
│   ├── components/      # UI Components (Layout, Navbar, LoadingOverlay)
│   ├── context/         # React Context (WalletContext with StellarWalletsKit)
│   ├── hooks/           # Custom hooks (useGroups)
│   ├── pages/           # Views (LandingPage, Dashboard, CreateGroup, GroupDetails)
│   ├── types/           # TS Interfaces
│   ├── utils/           # Helper functions (settlement, soroban RPC helper)
│   ├── App.tsx
│   └── main.tsx
├── package.json
└── README.md
```

---

## Setup Instructions

1. **Clone and Install Dependencies:**
   ```bash
   git clone <your-repository-url>
   cd stellarsyndicate
   npm install
   ```

2. **Run Development Server:**
   ```bash
   npm run dev
   ```

3. **Production Build & Preview:**
   ```bash
   npm run build
   npm run preview
   ```

---

## Environment Variables
Create a `.env` file in the root directory:
```env
VITE_STELLAR_NETWORK=testnet
VITE_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
VITE_CONTRACT_ADDRESS=CBFQ6FBVOSYZWSTXXPQVDNHR3H7LYOAQVHAHHJGMWSFUZNXZ4Z7L2GTY
```

---

## Screenshots Placeholders

### 1. Wallet Connected
![Wallet Connected](https://placehold.co/800x450/1e293b/ffffff?text=Wallet+Connected+Dashboard+Showing+XLM+Balance)
*Displays the StellarWalletsKit interface connected successfully, with the user's XLM balance shown in the top navigation bar.*

### 2. Balance Fetching
![Balance Fetching](https://placehold.co/800x450/1e293b/ffffff?text=XLM+Balance+Fetched+Successfully)
*Shows the native balance displayed clearly, updating automatically as transactions clear.*

### 3. Successful Transaction
![Successful Transaction](https://placehold.co/800x450/1e293b/ffffff?text=Successful+Stellar+Transaction)
*Visual confirmation modal showcasing the ledger execution status and transaction hash link.*

### 4. Transaction Feedback
![Transaction Feedback](https://placehold.co/800x450/1e293b/ffffff?text=Transaction+Feedback+Overlay)
*Demonstrates state changes (Pending -> Success/Failed) and detail cards showing active on-chain status.*

---

## Future Improvements
* **Milestone Escrow:** Lock member funds in the contract and release them incrementally to the Lead Buyer based on shipping milestones.
* **Volume Pricing Tiers:** Automatically adjust unit pricing as total order volume passes discount thresholds.
* **Reputation System:** Build historical scores for Lead Buyers based on successful settlements.

---

## License
MIT License
