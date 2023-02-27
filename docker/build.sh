#!/bin/bash

# Build image and tag it with image name and version
docker build . \
    --tag soroban-preview:7 \
    --force-rm \
    --rm
