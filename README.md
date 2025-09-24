## Transparent Charity DAO

A decentralized charity platform built with Blockchain (Base Sepolia) + DAO governance + AI-assisted review to ensure transparency, fairness, and accountability for every donation.

### Key Features
- **DAO governance**: Community (DAO members) review/vote on help requests and crowdfunding projects.
- **AI fraud detection**: Analyze description/proof to detect fraud, duplication, and risks → alert DAO before voting.
- **Smart contract treasury**: All donations, votes, disbursements, and project states are handled on-chain.
- **Transparency**: Every transaction is public on BaseScan. Users can track fund balance, donations, and request/project states.

### General Conditions
- **KYC required**: Mandatory for request/project creators.
- **Donations**: No KYC required.

---

## How It Works

### 1) Request Help (≤ 500 USDT)
1. Beneficiary (KYC-verified) submits a request: short description (≤100 chars) + evidence (uploaded to IPFS → `proofHash`).
2. AI analyzes the request and labels risk for DAO review.
3. DAO votes on-chain:
   - **Approve > 50%** → Smart contract pays out directly to the `beneficiary` address.
   - **Reject > 50%** → Request is closed, no disbursement.

Related contract APIs:
- `createRequest(amount, description, proofHash)`
- `getAllRequests()` / `getRequestById(requestId)`
- `vote(requestId, decision)`
- Events: `RequestCreated`, `VoteCast`, `PayoutSuccess`, `RequestRejected`

Relevant UI: `src/app/request/page.tsx`, `src/app/projects/requests/*`

### 2) Crowdfunding (> 500 USDT)
1. Project owner (KYC-verified) submits: `title` (≤50), `description` (≤100), `proofHash`, `targetAmount (USDT)`, `deadline` (7–365 days).
2. AI analyzes description/proof before DAO voting.
3. DAO voting:
   - Not approved → project is rejected and closed.
   - Approved → project opens for public donations.
4. Fundraising: Users donate USDT to the project’s on-chain treasury until deadline/closure.
5. Project owner calls `closeProject(projectId)` to withdraw raised funds.

Related contract APIs:
- `createProject(title, description, proofHash, targetAmount, deadline)`
- `voteOnProject(projectId, decision)`
- `donateToProject(projectId, amount)`
- `closeProject(projectId)`
- `getAllProjects()` / `getProjectById(projectId)`
- Events: `ProjectCreated`, `ProjectVoteCast`, `ProjectApproved/Rejected`, `ProjectDonation`, `ProjectClosed`

Relevant UI: `src/app/request/page.tsx` (create project), `src/app/projects/crowdfunding/*`

### Donate to Community Fund
- No KYC required. Users donate USDT directly to the community fund.
- Contract handles USDT approval → `donate(amount)` and updates the fund balance.
- UI: `src/app/donate/page.tsx` (donation UI + local history + fund balance).

Related contract APIs:
- `donate(amount)` (community fund)
- `getFundBalance()` / `getDashboardStats()`

---

## Architecture & Tech Stack
- **Frontend**: Next.js 15, React 19, Tailwind CSS 4, Framer Motion.
- **Wallet/Web3**: wagmi + viem, `@reown/appkit` (wallet connect + networks), Zustand store.
- **Smart Contract**: `DonationDAO` (ABI at `src/lib/abi/DonationDAO.ts`).
- **Storage**: IPFS via Pinata (API route `POST /api/pinata/upload`).

Notable directories:
- `src/app/donate/page.tsx`: Donate to community fund.
- `src/app/request/page.tsx`: Submit Request or create Crowdfunding.
- `src/app/projects/*`: Lists/details for Requests & Crowdfunding.
- `src/lib/contract.ts`: Contract calls (read/write), USDT approvals, Base Sepolia enforcement.
- `src/lib/abi/DonationDAO.ts`: ABI + contract addresses.
- `src/lib/upload.ts` + `src/app/api/pinata/upload/route.ts`: Upload to Pinata → use `cid` as `proofHash`.

---

## Network & Contracts
- **Network**: Base Sepolia (Chain ID `84532`)
- **Explorer**: `https://sepolia.basescan.org`
- **DonationDAO address**: `0xd61AeC17B56F39198eBCb75313E1f9Bf674BfaEE`
- **USDT (test) address**: `0x760f74c0e28766048aEB8C484F68453Ded161e31`

Note: The app will prompt users to switch to Base Sepolia. Transactions require test USDT and gas on Base Sepolia.

---

## Setup & Run

### Prerequisites
- Node.js 20+
- PNPM or NPM
- EVM wallet (WalletConnect / MetaMask) connected to Base Sepolia

### Environment variables
Create `.env.local` in the project root:

```
NEXT_PUBLIC_PROJECT_ID=your_appkit_project_id
PINATA_JWT=your_pinata_jwt
```

- `NEXT_PUBLIC_PROJECT_ID`: Project ID from `@reown/appkit`
- `PINATA_JWT`: Pinata JWT for IPFS uploads

### Install dependencies

```bash
pnpm install
# or
npm install
```

### Start dev server

```bash
pnpm dev
# or
npm run dev
```

Default at `http://localhost:3000`

### Build & start

```bash
pnpm build && pnpm start
# or
npm run build && npm start
```

---

## Quick User Guide
- **Donate to fund**: Open `Donate` → enter USDT amount → sign approve + donate → view tx on BaseScan.
- **Request Help**: Open `Request` → Request tab → enter amount (≤500), description, upload evidence → submit → wait for DAO vote.
- **Crowdfunding**: Open `Request` → Crowdfunding tab → enter title, description, goal (≥500), duration → submit → wait for DAO approval → receive community donations → project owner calls `Close` to withdraw funds.

---

## Security & Transparency
- All critical actions are on-chain: donate, vote, payout, close project.
- Users can inspect the contract and transactions on BaseScan.
- AI acts as an assistant for alerts; final decisions are made by DAO.

---

## Roadmap (suggested)
- Real-time on-chain event tracking (currently `getLatestContractEvents` is a placeholder).
- On-chain donation/vote history per user address.
- Configurable quorum/threshold in the UI.
- Integrate a KYC provider (currently simulated via user state).

---

## Contributing
PRs/Issues are welcome. Please describe changes clearly and include screenshots when helpful.

## License
MIT
