#!/bin/bash

set -e

echo Deploy the token contract
soroban-cli deploy --id 1 --wasm contracts/token/soroban_token_contract.wasm

echo Initialize the token contract
soroban-cli invoke --id 1 \
  --fn initialize \
  --arg-xdr AAAABAAAAAEAAAAAAAAAAgAAAAUAAAAHQWNjb3VudAAAAAAEAAAAAQAAAAQAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA= \
  --arg-xdr AAAAAQAAAAc= \
  --arg-xdr AAAABAAAAAEAAAAEAAAAEENpcmNsZSBVUyBEb2xsYXI= \
  --arg-xdr AAAABAAAAAEAAAAEAAAABFVTREM=

echo Build the crowdfund contract
cargo build --release --target wasm32-unknown-unknown

echo Deploy the crowdfund contract
soroban-cli deploy --id 0 --wasm target/wasm32-unknown-unknown/release/soroban_crowdfund_contract.wasm

echo Initialize the crowdfund contract
# TODO: Set the owner to something reasonable here.
owner='["Account", [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]]'
deadline=$(date +"%s")
soroban-cli invoke --id 0 \
  --fn initialize \
  --arg "$owner" \
  --arg-xdr "$((deadline + 86400))" \
  --arg-xdr "1000000000" \
  --arg 0x1
