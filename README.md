# Soroban Crowdfunding Dapp Example

This is a [Next.js](https://nextjs.org/), demoing how to build a dapp frontend
backed by smart contracts on Stellar.

## Getting Started

### Backend

1. Install the soroban-cli from https://soroban.stellar.org/docs/getting-started/setup#install-the-soroban-cli
2. Run `./initialize.sh` to load the contracts and initialize it.
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

## TODO

- [ ] Build the proper backend rpc server, and update instructions.
- [ ] Local env setup script/walkthrough
- [ ] Contract deployment walkthrough and/or tooling
- [ ] Contract tests
- [ ] Sending a txn to update data in the contract
	- [ ] txnbuilding with new xdr
- [ ] Waiting for the txn success and showing new value
	- how to poll/stream these changes?
	- should just be submitting the txn to horizon, and waiting for the result,
    then refreshing from the rpc node.
  - The more interesting bit is if other users change the value. How do we make
    it "multiplayer" efficiently?
- [ ] clean up the debris in the codebase
	- [ ] clean up api provider thing, and setup process. can simplify a lot for us for now.
- [ ] dropdowns for network, and disconnect menu
  - freigher can't disconnect yet, afaik
- [ ] strongly-typed contract rpc querying
	- blocked on manifest format/generation
	- [ ] generate a `useContract` hook, that gives a class with methods
- [ ] better scval formatting/parsing
	- was struggling with u64s & hypers
	- [ ] format scvals to string
	- [ ] parse scvals from string
- [ ] nicer loading indicator
- [ ] nicer error handling
