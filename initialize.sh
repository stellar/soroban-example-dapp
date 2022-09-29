#!/bin/bash

set -e

# TODO: Set the owner to something reasonable here. Probably whatever account
# soroban-cli is running stuff as?
admin="AAAABAAAAAEAAAAAAAAAAgAAAAUAAAAHQWNjb3VudAAAAAAEAAAAAQAAAAQAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="

echo Deploy the token contract
TOKEN_ID="$(
  soroban-cli token create \
    --name "Example Token" \
    --symbol "EXT" \
    --decimal 2
)"
mkdir -p .soroban
echo "$TOKEN_ID" > .soroban/token_id

echo Build the crowdfund contract
make build

echo Deploy the crowdfund contract
soroban-cli deploy --id 0 --wasm target/wasm32-unknown-unknown/release/soroban_crowdfund_contract.wasm

echo Initialize the crowdfund contract
deadline="$(($(date +"%s") + 86400))"
soroban-cli invoke --id 0 \
  --fn initialize \
  --arg-xdr "$admin" \
  --arg "$deadline" \
  --arg "1000000000" \
  --arg "$TOKEN_ID"
