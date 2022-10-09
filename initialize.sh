#!/bin/bash

set -e

# TODO: Set the recipient to something reasonable here. Probably whatever account
# soroban is running stuff as?
# TODO: Have a nicer way to build Identifiers on the CLI
# This is an Identifier for Account GBZXN7PIRZGNMHGA7MUUUF4GWPY5AYPV6LY4UV2GL6VJGIQRXFDNMADI
TOKEN_ADMIN="AAAABAAAAAEAAAAAAAAAAgAAAAUAAAAHQWNjb3VudAAAAAAEAAAAAQAAAAcAAAAAc3b96I5M1hzA+ylKF4az8dBh9fLxyldGX6qTIhG5RtY="

echo Deploy the token contract
TOKEN_ID="$(
  soroban token create \
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
  --arg-xdr "$TOKEN_ADMIN" \
  --arg "$deadline" \
  --arg "1000000000" \
  --arg "$TOKEN_ID" \
  --wasm target/wasm32-unknown-unknown/release/soroban_crowdfund_contract.wasm
