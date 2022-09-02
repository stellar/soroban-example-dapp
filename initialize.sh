soroban-cli deploy --id 1 --wasm soroban-token-contract.wasm
soroban-cli invoke --id 1 \
  --fn initialize \
  --arg-xdr AAAABAAAAAEAAAAAAAAAAgAAAAUAAAAHQWNjb3VudAAAAAAEAAAAAQAAAAQAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA= \
  --arg-xdr AAAAAQAAAAc= \
  --arg-xdr AAAABAAAAAEAAAAEAAAAEENpcmNsZSBVUyBEb2xsYXI= \
  --arg-xdr AAAABAAAAAEAAAAEAAAABFVTREM=

