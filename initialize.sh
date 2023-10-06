#!/bin/bash

set -e

NETWORK="$1"

SOROBAN_RPC_HOST="$2"

PATH=./target/bin:$PATH

if [[ -f "./.soroban-example-dapp/crowdfund_id" ]]; then
  echo "Found existing './.soroban-example-dapp' directory; already initialized."
  exit 0
fi

if [[ -f "./target/bin/soroban" ]]; then
  echo "Using soroban binary from ./target/bin"
else
  echo "Building pinned soroban binary"
  cargo install_soroban
fi

if [[ "$SOROBAN_RPC_HOST" == "" ]]; then
  # If soroban-cli is called inside the soroban-preview docker container,
  # it can call the stellar standalone container just using its name "stellar"
  if [[ "$IS_USING_DOCKER" == "true" ]]; then
    SOROBAN_RPC_HOST="http://stellar:8000"
    SOROBAN_RPC_URL="$SOROBAN_RPC_HOST"
  elif [[ "$NETWORK" == "futurenet" ]]; then
    SOROBAN_RPC_HOST="https://rpc-futurenet.stellar.org:443"
    SOROBAN_RPC_URL="$SOROBAN_RPC_HOST"
  else
     # assumes standalone on quickstart, which has the soroban/rpc path
    SOROBAN_RPC_HOST="http://localhost:8000"
    SOROBAN_RPC_URL="$SOROBAN_RPC_HOST/soroban/rpc"
  fi
else 
  SOROBAN_RPC_URL="$SOROBAN_RPC_HOST"  
fi

case "$1" in
standalone)
  SOROBAN_NETWORK_PASSPHRASE="Standalone Network ; February 2017"
  FRIENDBOT_URL="$SOROBAN_RPC_HOST/friendbot"
  ;;
futurenet)
  SOROBAN_NETWORK_PASSPHRASE="Test SDF Future Network ; October 2022"
  FRIENDBOT_URL="https://friendbot-futurenet.stellar.org/"
  ;;
*)
  echo "Usage: $0 standalone|futurenet [rpc-host]"
  exit 1
  ;;
esac

echo "Using $NETWORK network"
echo "  RPC URL: $SOROBAN_RPC_URL"
echo "  Friendbot URL: $FRIENDBOT_URL"

echo Add the $NETWORK network to cli client
soroban config network add \
  --rpc-url "$SOROBAN_RPC_URL" \
  --network-passphrase "$SOROBAN_NETWORK_PASSPHRASE" "$NETWORK"

echo Add $NETWORK to .soroban-example-dapp for use with npm scripts
mkdir -p .soroban-example-dapp
echo $NETWORK > ./.soroban-example-dapp/network
echo $SOROBAN_RPC_URL > ./.soroban-example-dapp/rpc-url
echo "$SOROBAN_NETWORK_PASSPHRASE" > ./.soroban-example-dapp/passphrase
echo "{ \"network\": \"$NETWORK\", \"rpcUrl\": \"$SOROBAN_RPC_URL\", \"networkPassphrase\": \"$SOROBAN_NETWORK_PASSPHRASE\" }" > ./shared/config.json

if !(soroban config identity ls | grep token-admin 2>&1 >/dev/null); then
  echo Create the token-admin identity
  soroban config identity generate token-admin
fi
ABUNDANCE_ADMIN_ADDRESS="$(soroban config identity address token-admin)"

# This will fail if the account already exists, but it'll still be fine.
echo Fund token-admin account from friendbot
curl --silent -X POST "$FRIENDBOT_URL?addr=$ABUNDANCE_ADMIN_ADDRESS" >/dev/null

ARGS="--network $NETWORK --source token-admin"

echo Build contracts
make build

echo Deploy the abundance token contract
ABUNDANCE_ID="$(
  soroban contract deploy $ARGS \
    --wasm target/wasm32-unknown-unknown/release/abundance_token.wasm
)"
echo "Contract deployed succesfully with ID: $ABUNDANCE_ID"
echo -n "$ABUNDANCE_ID" > .soroban-example-dapp/abundance_token_id

echo Deploy the crowdfund contract
CROWDFUND_ID="$(
  soroban contract deploy $ARGS \
    --wasm target/wasm32-unknown-unknown/release/soroban_crowdfund_contract.wasm
)"
echo "Contract deployed succesfully with ID: $CROWDFUND_ID"
echo "$CROWDFUND_ID" > .soroban-example-dapp/crowdfund_id

echo "Initialize the abundance token contract"
soroban contract invoke \
  $ARGS \
  --id "$ABUNDANCE_ID" \
  -- \
  initialize \
  --symbol ABND \
  --decimal 7 \
  --name abundance \
  --admin "$ABUNDANCE_ADMIN_ADDRESS"

echo "Initialize the crowdfund contract"
deadline="$(($(date +"%s") + 86400))"
soroban contract invoke \
  $ARGS \
  --id "$CROWDFUND_ID" \
  -- \
  initialize \
  --recipient "$ABUNDANCE_ADMIN_ADDRESS" \
  --deadline "$deadline" \
  --target_amount "1000000000" \
  --token "$ABUNDANCE_ID"
echo "Done"
