all: check build test

CARGO_BUILD_TARGET?=wasm32-unknown-unknown

test: fmt
	cargo test

build: fmt
	cargo build --target $(CARGO_BUILD_TARGET) --no-default-features --release
	cd target/$(CARGO_BUILD_TARGET)/release/ && \
		for i in *.wasm ; do \
			ls -l "$$i"; \
		done

build-optimized: fmt
	CARGO_TARGET_DIR=target-tiny cargo +nightly build --target $(CARGO_BUILD_TARGET) --release \
		-Z build-std=std,panic_abort \
		-Z build-std-features=panic_immediate_abort
	cd target-tiny/$(CARGO_BUILD_TARGET)/release/ && \
		for i in *.wasm ; do \
			wasm-opt -Oz "$$i" -o "$$i.tmp" && mv "$$i.tmp" "$$i"; \
			ls -l "$$i"; \
		done

build-docker:
	docker build . --tag soroban-preview:10

check: fmt
	cargo clippy --all-targets
	cargo clippy --release --target $(CARGO_BUILD_TARGET)

watch:
	cargo watch --clear --watch-when-idle --shell '$(MAKE)'

fmt:
	cargo fmt --all

clean:
	cargo clean
	CARGO_TARGET_DIR=target-tiny cargo +nightly clean
