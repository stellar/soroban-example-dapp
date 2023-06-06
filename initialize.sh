#!/bin/bash

set -e

NETWORK="$1"

SOROBAN_RPC_HOST="$2"

if [[ "$SOROBAN_RPC_HOST" == "" ]]; then
  # If soroban-cli is called inside the soroban-preview docker container,
  # it can call the stellar standalone container just using its name "stellar"
  if [[ "$IS_USING_DOCKER" == "true" ]]; then
    SOROBAN_RPC_HOST="http://stellar:8000"
  elif [[ "$NETWORK" == "futurenet" ]]; then
    SOROBAN_RPC_HOST="https://rpc-futurenet.stellar.org:443"
  else
    SOROBAN_RPC_HOST="http://localhost:8000"
  fi
fi

SOROBAN_RPC_URL="$SOROBAN_RPC_HOST/soroban/rpc"

case "$1" in
standalone)
  echo "Using standalone network with RPC URL: $SOROBAN_RPC_URL"
  SOROBAN_NETWORK_PASSPHRASE="Standalone Network ; February 2017"
  FRIENDBOT_URL="$SOROBAN_RPC_HOST/friendbot"
  ;;
futurenet)
  echo "Using Futurenet network with RPC URL: $SOROBAN_RPC_URL"
  SOROBAN_NETWORK_PASSPHRASE="Test SDF Future Network ; October 2022"
  FRIENDBOT_URL="https://friendbot-futurenet.stellar.org/"
  ;;
*)
  echo "Usage: $0 standalone|futurenet [rpc-host]"
  exit 1
  ;;
esac


echo Add the $NETWORK network to cli client
soroban config network add \
  --rpc-url "$SOROBAN_RPC_URL" \
  --network-passphrase "$SOROBAN_NETWORK_PASSPHRASE" "$NETWORK"

if !(soroban config identity ls | grep token-admin 2>&1 >/dev/null); then
  echo Create the token-admin identity
  soroban config identity generate token-admin
fi
TOKEN_ADMIN_SECRET="$(soroban config identity show token-admin)"
TOKEN_ADMIN_ADDRESS="$(soroban config identity address token-admin)"

# TODO: Remove this once we can use `soroban config identity` from webpack.
mkdir -p .soroban-example-dapp
echo "$TOKEN_ADMIN_SECRET" > .soroban-example-dapp/token_admin_secret
echo "$TOKEN_ADMIN_ADDRESS" > .soroban-example-dapp/token_admin_address

# This will fail if the account already exists, but it'll still be fine.
echo Fund token-admin account from friendbot
curl --silent -X POST "$FRIENDBOT_URL?addr=$TOKEN_ADMIN_ADDRESS" >/dev/null

ARGS="--network $NETWORK --source token-admin"

echo Wrap the Stellar asset
TOKEN_ID=$(soroban lab token wrap $ARGS --asset "EXT:$TOKEN_ADMIN_ADDRESS" 2>/dev/null)

if [[ "$TOKEN_ID" == "" ]]; then
  echo "Token already wrapped; everything initialized."
  exit 0
else
  echo "Token wrapped succesfully with TOKEN_ID: $TOKEN_ID"

  # TODO - remove this workaround when
  # https://github.com/stellar/soroban-tools/issues/661 is resolved.
  TOKEN_ADDRESS="$(node ./address_workaround.js $TOKEN_ID)"
  echo "Token Address converted to StrKey contract address format:" $TOKEN_ADDRESS

  echo -n "$TOKEN_ID" > .soroban-example-dapp/token_id

  echo Build the crowdfund contract
  make build

  echo Deploy the crowdfund contract
  CROWDFUND_ID="$(
    soroban contract deploy $ARGS \
      --wasm target/wasm32-unknown-unknown/release/soroban_crowdfund_contract.wasm
  )"
  echo "Contract deployed succesfully with ID: $CROWDFUND_ID"
  echo "$CROWDFUND_ID" > .soroban-example-dapp/crowdfund_id

  echo "Initialize the crowdfund contract"
  deadline="$(($(date +"%s") + 86400))"
  soroban contract invoke \
    $ARGS \
    --id "$CROWDFUND_ID" \
    -- \
    initialize \
    --recipient "$TOKEN_ADMIN_ADDRESS" \
    --deadline "$deadline" \
    --target_amount "1000000000" \
    --token "$TOKEN_ADDRESS"

  echo "Done"
fi
