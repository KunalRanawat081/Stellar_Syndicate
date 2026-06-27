# StellarSyndicate

StellarSyndicate is a decentralized bulk-buy and co-op purchasing application designed to help small businesses and communities pool resources to access wholesale prices, leveraging the Stellar network for fast, low-cost settlements.

## The Concept
A platform for small businesses, local communities, or creators to form temporary "purchasing syndicates." By grouping together, they can buy goods in bulk to access wholesale prices. One person acts as the "Lead Buyer," and the app tracks the shared logistical costs and settles the debts.

## Features
- **Groups**: Create a specific bulk order (e.g., "Summer 2026 Coffee Bean Import").
- **Members**: Add individual buyers/businesses participating in the order.
- **Expenses Tracker**: Tracks the base invoice, and shared overhead like freight shipping, customs/import duties, and temporary warehousing.
- **Settlement Calculator**: Handles the complex math of splitting fixed costs evenly among members, while splitting variable costs proportionally based on what each person ordered.
- **Stellar Wallet Connection**: Connect with Freighter.
- **Modern UI**: Dark mode first, glassmorphism, responsive design.

## Screenshots
*(Placeholders for screenshots)*
- `[Landing Page Screenshot]`
- `[Dashboard Screenshot]`
- `[Group Details & Settlements Screenshot]`

## Tech Stack
- **Frontend**: React, TypeScript, Vite
- **Styling**: TailwindCSS, Framer Motion, Lucide React
- **Blockchain Integration**: `@stellar/freighter-api`, `@stellar/stellar-sdk`
- **Routing**: React Router

## Folder Structure
```text
src/
├── components/    # Reusable UI components (Layout, Navbar)
├── context/       # React Context (WalletProvider)
├── hooks/         # Custom hooks (useGroups for LocalStorage)
├── pages/         # Route components (LandingPage, Dashboard, CreateGroup, GroupDetails)
├── types/         # TypeScript interfaces
├── utils/         # Helper functions (Settlement Calculator)
├── App.tsx        # Main application routing
└── main.tsx       # Entry point
```

## Running Locally

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd stellarsyndicate
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start the Development Server**
   ```bash
   npm run dev
   ```

4. **Build for Production**
   ```bash
   npm run build
   ```

## Smart Contract Deployment (Testnet)
A basic Soroban smart contract for the application has been written and deployed to the Stellar Testnet:
- **Contract Address:** `CBOQVATTTT6WVWEJZMM27FJPAXR6VFTIXG7OKADYXFGDIBFVSR7R46KU`
- **Explorer:** [View on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CBOQVATTTT6WVWEJZMM27FJPAXR6VFTIXG7OKADYXFGDIBFVSR7R46KU)
- **Deployment Details:** Deployed using the `deployer` identity because the specific user's secret key was not provided.

If you have the secret key for `GASOTDFOLVMZ7SERRCX3NUBQTFRKKQNJX5HAO7MYE5JPNE4GE77SASGH`, you can deploy it yourself by running:
```bash
stellar contract deploy --wasm target\wasm32v1-none\release\kunal_contract.wasm --source <YOUR_SECRET_KEY> --network testnet
```

## Future Improvements
- **Escrow/Milestone Payments (Soroban)**: Lock funds in a smart contract and release to the Lead Buyer upon verifiable milestones.
- **Dynamic Volume Pricing**: Dynamically recalculate unit prices as order volume increases.
- **Reputation System**: Build reputation scores for Lead Buyers and members.
- **Multi-Asset Settlements**: Use Stellar path payments to allow members to pay in their preferred asset while the Lead Buyer receives USDC.

## License
MIT License
