#!/bin/bash

set -e

if [[ "$1" == "-h" ]] || [[ "$1" == "--help" ]]; then
    echo "Usage: $0 [FREIGHTER_WALLET_ADDRESS]"
    exit 1
fi

# TODO: Set the owner to something reasonable here. Probably whatever account
# soroban is running stuff as?
# This is an Identifier for Account GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF
# TODO: Have a nicer way to build Identifiers on the CLI
admin="AAAABAAAAAEAAAAAAAAAAgAAAAUAAAAHQWNjb3VudAAAAAAEAAAAAQAAAAcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"

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
soroban deploy --id 0 --wasm target/wasm32-unknown-unknown/release/soroban_crowdfund_contract.wasm

echo Initialize the crowdfund contract
deadline="$(($(date +"%s") + 86400))"
soroban invoke --id 0 \
  --fn initialize \
  --arg-xdr "$admin" \
  --arg "$deadline" \
  --arg "1000000000" \
  --arg "$TOKEN_ID"

if [ -n "$1" ]; then
  echo Minting 100.00 tokens to the user wallet: "$1"
  ./mint.sh "$1" 10000
else
  echo User wallet not specified, skipping minting tokens.
fi
