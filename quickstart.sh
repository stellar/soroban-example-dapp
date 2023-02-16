#!/bin/bash

set -e

case "$1" in
standalone)
    echo "Using standalone network"
    ARGS="--standalone --enable-core-artificially-accelerate-time-for-testing"
    ;;
futurenet)
    echo "Using Futurenet network"
    ARGS="--futurenet"
    ;;
*)
    echo "Usage: $0 standalone|futurenet"
    exit 1
    ;;
esac

docker run --rm -ti \
  --platform linux/amd64 \
  --name stellar \
  -p 8000:8000 \
  stellar/quickstart:soroban-dev@sha256:81c23da078c90d0ba220f8fc93414d0ea44608adc616988930529c58df278739 \
  $ARGS \
  --enable-soroban-rpc \
  --protocol-version 20
