#!/bin/bash

set -e
set -x

if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Usage: $0 TARGET_ADDRESS AMOUNT"
    exit 1
fi

TOKEN_ID="$(cat .soroban/token_id)"
if [ -z "$TOKEN_ID" ]; then
    echo "Token ID Missing. Run ./initialize.sh"
    exit 1
fi

# TODO: Set the owner to something reasonable here. Probably whatever account
# soroban is running stuff as?
# This is an Identifier for Account GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF
# TODO: Have a nicer way to build Identifiers on the CLI
admin="GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF"
admin_identifier="AAAABAAAAAEAAAAAAAAAAgAAAAUAAAAHQWNjb3VudAAAAAAEAAAAAQAAAAcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
invoker="AAAABAAAAAEAAAAAAAAAAQAAAAUAAAAHSW52b2tlcgA="

# TODO: Get this working for the generic case
# echo Mint some tokens to the user
# soroban invoke --id "$TOKEN_ID" \
#   --fn mint \
#   --account "$admin" \
#   --arg-xdr "$invoker" \
#   --arg "1" \
#   --arg-xdr "$admin_identifier" \
#   --arg "$2"

echo Mint 1000.00 tokens to the quickstart root wallet: GBZXN7PIRZGNMHGA7MUUUF4GWPY5AYPV6LY4UV2GL6VJGIQRXFDNMADI
curl -v -X POST \
  --header "content-type: application/json" \
  http://localhost:8080/api/v1/jsonrpc \
  --data-binary '{"jsonrpc":"2.0", "id":2, "method":"simulateTransaction", "params":["AAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGQAAAAAAAAAAQAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAGAAAAAAAAAAGAAAABAAAAAEAAAAEAAAAINVbWjpXk1OVRflX99p4P3sZFZNpzNsZxT29EX6/wIhCAAAABQAAAARtaW50AAAABAAAAAEAAAAAAAAAAQAAAAUAAAAHSW52b2tlcgAAAAAEAAAAAQAAAAUAAAAAAAAABAAAAAEAAAAAAAAAAgAAAAUAAAAHQWNjb3VudAAAAAAEAAAAAQAAAAcAAAAAc3b96I5M1hzA+ylKF4az8dBh9fLxyldGX6qTIhG5RtYAAAAEAAAAAQAAAAUAAAABAAAAAwMNQAAAAAAAAAAAAAAAAAAAAAAA"]}'
