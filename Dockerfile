# Based on Preview 7
# https://soroban.stellar.org/docs/reference/releases

FROM ubuntu:20.04

RUN apt update && apt install -y curl

RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs > rust_install.sh
RUN sh rust_install.sh -y
RUN echo $PATH
ENV PATH="$PATH:/root/.cargo/bin"
RUN rustup target add wasm32-unknown-unknown

RUN apt install -y build-essential
RUN cargo install --locked --version 0.6.0 soroban-cli
# WORKDIR /
RUN mkdir /workspace
WORKDIR /workspace
ENV IS_USING_DOCKER=true
