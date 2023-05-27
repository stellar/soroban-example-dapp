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
