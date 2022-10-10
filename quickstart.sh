#!/bin/bash

set -e

REVISION=089d356c55f7e5da92d5440d29a1772c701422e6db8ac0400ef8e85518d2df9f

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
