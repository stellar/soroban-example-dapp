#!/bin/bash

set -e

case "$1" in
localnet)
    echo "Using localnet network"
    ARGS="--localnet"
    ;;
futurenet)
    echo "Using Futurenet network"
    ARGS="--futurenet"
    ;;
*)
    echo "Usage: $0 localnet|futurenet"
    exit 1
    ;;
esac

docker run --rm -ti \
  --platform linux/amd64 \
  --name stellar \
  -p 8000:8000 \
  stellar/quickstart:soroban-dev \
  $ARGS \
  --enable-soroban-rpc \
  --protocol-version 20
