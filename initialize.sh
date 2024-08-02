#!/bin/bash

set -e

NETWORK="$1"

STELLAR_RPC_HOST="$2"

PATH=./target/bin:$PATH

if [[ -f "./.soroban-example-dapp/crowdfund_id" ]]; then
  echo "Found existing './.soroban-example-dapp' directory; already initialized."
  exit 0
fi

stellar="./target/bin/stellar"
if [[ -f "$stellar" ]]; then
  current=$($stellar --version | head -n 1 | cut -d ' ' -f 2)
  desired=$(cat .cargo/config.toml | grep -oE -- "--version\s+\S+" | awk '{print $2}')
  if [[ "$current" != "$desired" ]]; then
    echo "Current pinned stellar binary: $current. Desired: $desired. Building stellar binary."
    cargo install_stellar
  else
    echo "Using stellar binary from ./target/bin"
  fi
else
  echo "Building pinned stellar-cli binary"
  cargo install_stellar
fi

if [[ "$STELLAR_RPC_HOST" == "" ]]; then
  # If stellar-cli is called inside the stellar-preview docker container,
  # it can call the stellar standalone container just using its name "stellar"
  if [[ "$IS_USING_DOCKER" == "true" ]]; then
    STELLAR_RPC_HOST="http://stellar:8000"
    STELLAR_RPC_URL="$STELLAR_RPC_HOST"
  elif [[ "$NETWORK" == "futurenet" ]]; then
    STELLAR_RPC_HOST="https://rpc-futurenet.stellar.org:443"
    STELLAR_RPC_URL="$STELLAR_RPC_HOST"
  elif [[ "$NETWORK" == "testnet" ]]; then
    STELLAR_RPC_HOST="https://soroban-testnet.stellar.org:443"
    STELLAR_RPC_URL="$STELLAR_RPC_HOST"
  else
    # assumes standalone on quickstart, which has the stellar/rpc path
    STELLAR_RPC_HOST="http://localhost:8000"
    STELLAR_RPC_URL="$STELLAR_RPC_HOST/stellar/rpc"
  fi
else
  STELLAR_RPC_URL="$STELLAR_RPC_HOST"
fi

case "$1" in
standalone)
  STELLAR_NETWORK_PASSPHRASE="Standalone Network ; February 2017"
  FRIENDBOT_URL="$STELLAR_RPC_HOST/friendbot"
  ;;
futurenet)
  STELLAR_NETWORK_PASSPHRASE="Test SDF Future Network ; October 2022"
  FRIENDBOT_URL="https://friendbot-futurenet.stellar.org/"
  ;;
  testnet)
  STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
  FRIENDBOT_URL="https://friendbot.stellar.org/"
  ;;
*)
  echo "Usage: $0 standalone|futurenet [rpc-host]"
  exit 1
  ;;
esac

echo "Using $NETWORK network"
echo "  RPC URL: $STELLAR_RPC_URL"
echo "  Friendbot URL: $FRIENDBOT_URL"

echo Add the $NETWORK network to cli client
stellar network add \
  --rpc-url "$STELLAR_RPC_URL" \
  --network-passphrase "$STELLAR_NETWORK_PASSPHRASE" "$NETWORK"

echo Add $NETWORK to .soroban-example-dapp for use with npm scripts
mkdir -p .soroban-example-dapp
echo $NETWORK >./.soroban-example-dapp/network
echo $STELLAR_RPC_URL >./.soroban-example-dapp/rpc-url
echo "$STELLAR_NETWORK_PASSPHRASE" >./.soroban-example-dapp/passphrase
echo "{ \"network\": \"$NETWORK\", \"rpcUrl\": \"$STELLAR_RPC_URL\", \"networkPassphrase\": \"$STELLAR_NETWORK_PASSPHRASE\" }" >./shared/config.json

if !(stellar keys ls | grep token-admin 2>&1 >/dev/null); then
  echo Create the token-admin identity
  stellar keys generate token-admin \
    --rpc-url "$STELLAR_RPC_URL" \
    --network-passphrase "$STELLAR_NETWORK_PASSPHRASE" \
    --network "$NETWORK"
fi
ABUNDANCE_ADMIN_ADDRESS="$(stellar keys address token-admin)"

# This will fail if the account already exists, but it'll still be fine.
echo Fund token-admin account from friendbot
curl --silent -X POST "$FRIENDBOT_URL?addr=$ABUNDANCE_ADMIN_ADDRESS" >/dev/null

ARGS="--network $NETWORK --source token-admin"

echo Build contracts
make build

echo Deploy the abundance token contract
ABUNDANCE_ID="$(
  stellar contract deploy $ARGS \
    --wasm target/wasm32-unknown-unknown/release/abundance_token.wasm \
    --alias abundance
)"
echo "Contract deployed succesfully with ID: $ABUNDANCE_ID"
echo -n "$ABUNDANCE_ID" >.soroban-example-dapp/abundance_token_id

# echo Deploy the crowdfund contract
CROWDFUND_ID="$(
  stellar contract deploy $ARGS \
    --wasm target/wasm32-unknown-unknown/release/stellar_crowdfund_contract.wasm \
    --alias crowdfund
)"
echo "Contract deployed succesfully with ID: $CROWDFUND_ID"
echo -n "$CROWDFUND_ID" >.soroban-example-dapp/crowdfund_id

echo "Initialize the abundance token contract"
stellar contract invoke \
  $ARGS \
  --id abundance \
  -- \
  initialize \
  --symbol ABND \
  --decimal 7 \
  --name abundance \
  --admin "$ABUNDANCE_ADMIN_ADDRESS"

echo "Initialize the crowdfund contract"
deadline="$(($(date +"%s") + 86400))"
stellar contract invoke \
  $ARGS \
  --id crowdfund \
  -- \
  initialize \
  --recipient "$ABUNDANCE_ADMIN_ADDRESS" \
  --deadline "$deadline" \
  --target_amount "1000000000" \
  --token "$ABUNDANCE_ID"
echo "Done"
