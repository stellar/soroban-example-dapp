#!/bin/bash

set -e

# TODO: Set the recipient to something reasonable here. Probably whatever account
# soroban is running stuff as?
# TODO: Have a nicer way to build Identifiers on the CLI
TOKEN_ADMIN=GBZXN7PIRZGNMHGA7MUUUF4GWPY5AYPV6LY4UV2GL6VJGIQRXFDNMADI
TOKEN_ADMIN_IDENTIFIER="AAAABAAAAAEAAAAAAAAAAgAAAAUAAAAHQWNjb3VudAAAAAAEAAAAAQAAAAcAAAAAc3b96I5M1hzA+ylKF4az8dBh9fLxyldGX6qTIhG5RtY="

case "$1" in
standalone)
  echo "Using standalone network"
  export SOROBAN_RPC_URL=http://localhost:8000/soroban/rpc
  export SOROBAN_NETWORK_PASSPHRASE="Standalone Network ; February 2017"
  export SOROBAN_SECRET_KEY="SC5O7VZUXDJ6JBDSZ74DSERXL7W3Y5LTOAMRF7RQRL3TAGAPS7LUVG3L"

  echo Fund token admin account from friendbot
  curl "$SOROBAN_RPC_URL/friendbot?addr=$TOKEN_ADMIN"
  ;;
futurenet)
  echo "Using Futurenet network"
  export SOROBAN_RPC_URL=http://localhost:8000/soroban/rpc
  export SOROBAN_NETWORK_PASSPHRASE="Test SDF Future Network ; October 2022"
  export SOROBAN_SECRET_KEY="SC5O7VZUXDJ6JBDSZ74DSERXL7W3Y5LTOAMRF7RQRL3TAGAPS7LUVG3L"
  # TODO: Use friendbot to fund the token admin, or figure our token admin here...
  # curl "$SOROBAN_RPC_URL/friendbot?addr=$TOKEN_ADMIN"
  ;;
""|sandbox)
  # no-op
  ;;
*)
  echo "Usage: $0 sandbox|standalone|futurenet"
  exit 1
  ;;
esac


echo Deploy the token contract
TOKEN_ID="$(
  soroban token create \
    --admin "$TOKEN_ADMIN" \
    --name "Example Token" \
    --symbol "EXT" \
    --decimal 2
)"
mkdir -p .soroban
echo "$TOKEN_ID" > .soroban/token_id

echo Build the crowdfund contract
make build

echo Deploy the crowdfund contract
CROWDFUND_ID="$(
  soroban deploy \
    --wasm target/wasm32-unknown-unknown/release/soroban_crowdfund_contract.wasm
)"
echo "$CROWDFUND_ID" > .soroban/crowdfund_id

echo Initialize the crowdfund contract
deadline="$(($(date +"%s") + 86400))"
soroban invoke \
  --id "$CROWDFUND_ID" \
  --fn initialize \
  --arg-xdr "$TOKEN_ADMIN_IDENTIFIER" \
  --arg "$deadline" \
  --arg "1000000000" \
  --arg "$TOKEN_ID" \
  --wasm target/wasm32-unknown-unknown/release/soroban_crowdfund_contract.wasm
