// TODO - remove this workaround when
// https://github.com/stellar/soroban-tools/issues/661 is resolved.

const SorobanClient = require('soroban-client');

const contractId = process.argv[2] || undefined;
if (contractId) {
  if (SorobanClient.StrKey.isValidContract(contractId)) {
    console.log(contractId);
    return;
  }
  const buf = Buffer.from(contractId, "hex")
  console.log(SorobanClient.StrKey.encodeContract(buf));
} 
