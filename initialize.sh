#!/bin/bash

set -e

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

echo Approve the transfer
curl -v -X POST \
  --header "content-type: application/json" \
  http://localhost:8080/api/v1/jsonrpc \
  --data-binary '{"jsonrpc":"2.0", "id":2, "method":"sendTransaction", "params":["AAAAAgAAAABzdv3ojkzWHMD7KUoXhrPx0GH18vHKV0ZfqpMiEblG1gAAAGQAAAAAAAAAAwAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAGAAAAAAAAAAGAAAABAAAAAEAAAAEAAAAINVbWjpXk1OVRflX99p4P3sZFZNpzNsZxT29EX6/wIhCAAAABQAAAAdhcHByb3ZlAAAAAAQAAAABAAAAAAAAAAEAAAAFAAAAB0ludm9rZXIAAAAABAAAAAEAAAAFAAAAAAAAAAQAAAABAAAAAAAAAAIAAAAFAAAACENvbnRyYWN0AAAABAAAAAEAAAAEAAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAEAAAAFAAAAAQAAAAEKAAAAAAAAAQAAAAbVW1o6V5NTlUX5V/faeD97GRWTaczbGcU9vRF+v8CIQgAAAAMAAAADAAAAAQAAAAbVW1o6V5NTlUX5V/faeD97GRWTaczbGcU9vRF+v8CIQgAAAAQAAAABAAAAAAAAAAIAAAAFAAAACUFsbG93YW5jZQAAAAAAAAQAAAABAAAAAQAAAAIAAAAFAAAABGZyb20AAAAEAAAAAQAAAAAAAAACAAAABQAAAAdBY2NvdW50AAAAAAQAAAABAAAABwAAAABzdv3ojkzWHMD7KUoXhrPx0GH18vHKV0ZfqpMiEblG1gAAAAUAAAAHc3BlbmRlcgAAAAAEAAAAAQAAAAAAAAACAAAABQAAAAhDb250cmFjdAAAAAQAAAABAAAABAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"]}'


echo Simulate doing the deposit
curl -v -X POST \
  --header "content-type: application/json" \
  http://localhost:8080/api/v1/jsonrpc \
  --data-binary '{"jsonrpc":"2.0", "id":2, "method":"simulateTransaction", "params":["AAAAAgAAAABzdv3ojkzWHMD7KUoXhrPx0GH18vHKV0ZfqpMiEblG1gAAAGQAAAAAAAAAAgAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAGAAAAAAAAAAEAAAABAAAAAEAAAAEAAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQAAAAdkZXBvc2l0AAAAAAQAAAABAAAAAAAAAAIAAAAFAAAAB0FjY291bnQAAAAABAAAAAEAAAAHAAAAAHN2/eiOTNYcwPspSheGs/HQYfXy8cpXRl+qkyIRuUbWAAAABAAAAAEAAAAFAAAAAQAAAAECAAAAAAAAAAAAAAAAAAAAAAAAAA=="]}'

