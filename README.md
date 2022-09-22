# Soroban Crowdfunding Dapp Example

This is a [Next.js](https://nextjs.org/), demoing how to build a dapp frontend
backed by smart contracts on Stellar.

## Getting Started

### Backend

1. Install the soroban-cli from https://soroban.stellar.org/docs/getting-started/setup#install-the-soroban-cli
2. Run `./initialize.sh` to load the contracts and initialize it.
  - Note: this will create a `.soroban` sub-directory, to contain the sandbox
    network data.
3. Run the backend with `soroban-cli serve`

### Frontend

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## User Workflows

The contract dev should be able to:

- Clone the example repo (this one)
- Choose their target amount and deadline
- Deploy their contract to futurenet
- Deploy a soroban rpc server somewhere (TBD)
- Deploy the example web ui somewhere (e.g. netlify)

Then via the web UI, users should be able to:

- Connect their wallet (freighter for now)
- See their current balance(s)
- See the current fundraising status (total amount & time remaining)
- See allowed assets (xlm-only for now?)
- Deposit an allowed asset
- See their deposit(s) appear on the page as the transactions are confirmed.
- "Live"-Update the page with the total amount with the new amount

## Wallet Integration & Data Fetching

There is a `./wallet` directory, which contains a small library to connect to
the user's freighter wallet, as well as some React hooks to talk to a
soroban-rpc server (e.g. `soroban-cli serve`), to fetch data and send
transactions.

Data from contracts is fetched using the `useContractValue` hook in
`./wallet/hooks/useContractValue.tsx`. Transactions are submitted to the network
using the `useSendTransactions` hook in `./wallet/hooks/useSendTransaction.tsx`.
