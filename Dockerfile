# Based on Preview 7
# https://soroban.stellar.org/docs/reference/releases
FROM ubuntu:22.04

ENV PATH="/root/.cargo/bin:${PATH}"
ENV PATH="$PATH:/workspace/target/bin"
ENV IS_USING_DOCKER=true

RUN apt update && \
    apt install -y curl build-essential && \
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y && \
    rustup target add wasm32-unknown-unknown

WORKDIR /workspace

COPY .cargo /root/.cargo

WORKDIR /workspace/target/bin

CMD ["./soroban", "--version"]
