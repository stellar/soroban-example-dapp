#!/bin/bash

set -e

REVISION=42641a3dbc46565584e424697f042aec7d5063681cc22a0f490f78fa1f1e1de0

case "$1" in
standalone)
    echo "Using standalone network"
    ARGS="--standalone"
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
  stellar/quickstart@sha256:$REVISION \
  $ARGS \
  --enable-soroban-rpc \
  --protocol-version 20
