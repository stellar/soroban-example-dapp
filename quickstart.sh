#!/bin/bash

set -e

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
  stellar/quickstart:soroban-dev@sha256:8046391718f8e58b2b88b9c379abda3587bb874689fa09b2ed4871a764ebda27 \
  $ARGS \
  --enable-soroban-rpc \
  --protocol-version 20
