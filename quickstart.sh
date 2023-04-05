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

shift

# Run the soroban-preview container
# Remember to do:
# make build-docker

echo "Creating docker soroban network"
(docker network inspect soroban-network -f '{{.Id}}' 2>/dev/null) \
  || docker network create soroban-network

echo "Searching for a previous soroban-preview docker container"
containerID=$(docker ps --filter="name=soroban-preview" --all --quiet)
if [[ ${containerID} ]]; then
    echo "Start removing soroban-preview container."
    docker rm --force soroban-preview
    echo "Finished removing soroban-preview container."
else
    echo "No previous soroban-preview container was found"
fi

currentDir=$(pwd)
docker run -dti \
  --volume ${currentDir}:/workspace \
  --name soroban-preview \
  -p 8001:8000 \
  --ipc=host \
  --network soroban-network \
  soroban-preview:7

# Run the stellar quickstart image
docker run --rm -ti \
  --platform linux/amd64 \
  --name stellar \
  --network soroban-network \
  -p 8000:8000 \
  stellar/quickstart:soroban-dev@sha256:3d14a36df8e7d3da899369f00231125d81745ab457076082d22eabc35c6de78e \
  $ARGS \
  --enable-soroban-rpc \
  --protocol-version 20 \
  "$@" # Pass through args from the CLI
