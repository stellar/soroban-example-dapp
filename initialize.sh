#!/bin/bash

set -e

# TODO: Set the recipient to something reasonable here. Probably whatever account
# soroban is running stuff as?
# TODO: Have a nicer way to build Identifiers on the CLI
TOKEN_ADMIN="GDT2NORMZF6S2T4PT4OBJJ43OPD3GPRNTJG3WVVFB356TUHWZQMU6C3U"
TOKEN_ADMIN_IDENTIFIER="AAAABAAAAAEAAAAAAAAAAgAAAAUAAAAHQWNjb3VudAAAAAAEAAAAAQAAAAcAAAAA56a6LMl9LU+PnxwUp5tzx7M+LZpNu1alDvvp0PbMGU8="

case "$1" in
standalone)
  echo "Using standalone network"
  export SOROBAN_RPC_HOST="http://localhost:8000"
  export SOROBAN_RPC_URL="$SOROBAN_RPC_HOST/soroban/rpc"
  export SOROBAN_NETWORK_PASSPHRASE="Standalone Network ; February 2017"
  export SOROBAN_SECRET_KEY="SAKCFFFNCE7XAWYMYVRZQYKUK6KMUCDIINLWISJYTMYJLNR2QLCDLFVT"

  echo Fund token admin account from friendbot
  curl "$SOROBAN_RPC_HOST/friendbot?addr=$TOKEN_ADMIN"
  ;;
futurenet)
  echo "Using Futurenet network"
  export SOROBAN_RPC_HOST="http://localhost:8000"
  export SOROBAN_RPC_URL="$SOROBAN_RPC_HOST/soroban/rpc"
  export SOROBAN_NETWORK_PASSPHRASE="Test SDF Future Network ; October 2022"
  export SOROBAN_SECRET_KEY="SAKCFFFNCE7XAWYMYVRZQYKUK6KMUCDIINLWISJYTMYJLNR2QLCDLFVT"
  # TODO: Use friendbot to fund the token admin, or figure our token admin here...
  curl "https://friendbot-futurenet.stellar.org/?addr=$TOKEN_ADMIN"
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
    --wasm target-tiny/wasm32-unknown-unknown/release/soroban_crowdfund_contract.wasm
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
