#!/bin/bash

set -e

# TODO: Set the recipient to something reasonable here. Probably whatever account
# soroban is running stuff as?
# TODO: Have a nicer way to build Identifiers on the CLI
TOKEN_ADMIN_ADDRESS="GDT2NORMZF6S2T4PT4OBJJ43OPD3GPRNTJG3WVVFB356TUHWZQMU6C3U"
TOKEN_ADMIN_SECRET="SAKCFFFNCE7XAWYMYVRZQYKUK6KMUCDIINLWISJYTMYJLNR2QLCDLFVT"

NETWORK="$1"

case "$1" in
standalone)
  echo "Using standalone network"
  SOROBAN_RPC_HOST="http://localhost:8000"
  SOROBAN_RPC_URL="$SOROBAN_RPC_HOST/soroban/rpc"
  SOROBAN_NETWORK_PASSPHRASE="Standalone Network ; February 2017"
  FRIENDBOT_URL="$SOROBAN_RPC_HOST/friendbot"
  ;;
futurenet)
  echo "Using Futurenet network"
  SOROBAN_RPC_HOST="http://localhost:8000"
  SOROBAN_RPC_URL="$SOROBAN_RPC_HOST/soroban/rpc"
  SOROBAN_NETWORK_PASSPHRASE="Test SDF Future Network ; October 2022"
  FRIENDBOT_URL="https://friendbot-futurenet.stellar.org/"
  ;;
*)
  echo "Usage: $0 standalone|futurenet"
  exit 1
  ;;
esac

if !(soroban config network ls | grep "$NETWORK" 2>&1 >/dev/null); then
  echo Add the $NETWORK network to cli client
  soroban config network add "$NETWORK" \
    --rpc-url "$SOROBAN_RPC_URL" \
    --network-passphrase "$SOROBAN_NETWORK_PASSPHRASE"
fi

if [ ! -f ".soroban/identities/token-admin.toml" ]; then
  echo Create the token-admin identity
  mkdir -p ".soroban/identities"
  echo "secret_key = \"$TOKEN_ADMIN_SECRET\"" > ".soroban/identities/token-admin.toml"
fi

# This will fail if the account already exists, but it'll still be fine.
echo Fund token-admin account from friendbot
curl --silent -X POST "$FRIENDBOT_URL?addr=$TOKEN_ADMIN_ADDRESS" >/dev/null

ARGS="--network $NETWORK --identity token-admin"

echo Wrap the Stellar asset
mkdir -p .soroban
TOKEN_ID=$(soroban lab token wrap $ARGS --asset "EXT:$TOKEN_ADMIN_ADDRESS")
echo -n "$TOKEN_ID" > .soroban/token_id

echo Build the crowdfund contract
make build

echo Deploy the crowdfund contract
CROWDFUND_ID="$(
  soroban contract deploy $ARGS \
    --wasm target/wasm32-unknown-unknown/release/soroban_crowdfund_contract.wasm
)"
echo "$CROWDFUND_ID" > .soroban/crowdfund_id

echo "Contract deployed succesfully with ID: $CROWDFUND_ID"

echo "Wait 5s for a ledger to close"
# TODO: Figure out why we need this. Without it, soroban-rpc
# simulateTransaction says AccessToUnknownLedgerEntry...
sleep 5

echo "Initialize the crowdfund contract"
deadline="$(($(date +"%s") + 86400))"
soroban contract invoke \
  $ARGS \
  --wasm target/wasm32-unknown-unknown/release/soroban_crowdfund_contract.wasm \
  --id "$CROWDFUND_ID" \
  --fn initialize -- \
  --recipient "$TOKEN_ADMIN_ADDRESS" \
  --deadline "$deadline" \
  --target_amount "1000000000" \
  --token "$TOKEN_ID"

echo "Done"
