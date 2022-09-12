#!/bin/bash

set -e

# TODO: Set the owner to something reasonable here. Probably whatever account
# soroban-cli is running stuff as?
admin="AAAABAAAAAEAAAAAAAAAAgAAAAUAAAAHQWNjb3VudAAAAAAEAAAAAQAAAAQAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="

echo Deploy the token contract
soroban-cli deploy --id 1 --wasm contracts/token/soroban_token_contract.wasm

echo Initialize the token contract
soroban-cli invoke --id 1 \
  --fn initialize \
  --arg-xdr "$admin" \
  --arg-xdr AAAAAQAAAAc= \
  --arg-xdr AAAABAAAAAEAAAAEAAAAEENpcmNsZSBVUyBEb2xsYXI= \
  --arg-xdr AAAABAAAAAEAAAAEAAAABFVTREM=

echo Build the crowdfund contract
cargo build --release --target wasm32-unknown-unknown

echo Deploy the crowdfund contract
soroban-cli deploy --id 0 --wasm target/wasm32-unknown-unknown/release/soroban_crowdfund_contract.wasm

echo Initialize the crowdfund contract
deadline="$(($(date +"%s") + 86400))"
soroban-cli invoke --id 0 \
  --fn initialize \
  --arg-xdr "$admin" \
  --arg "$deadline" \
  --arg "1000000000" \
  --arg '[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]'
