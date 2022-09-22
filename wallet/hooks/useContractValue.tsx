import React from "react";
import * as SorobanSdk from "soroban-sdk";
import { AppContext } from "../AppContext";
let xdr = SorobanSdk.xdr;

// Dummy source account for simulation.
// TODO: Allow the user to specify this
const source = new SorobanSdk.Account('GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGSNFHEYVXM3XOJMDS674JZ', '0');

export type ContractValue = {loading?: true, result?: SorobanSdk.xdr.ScVal, error?: string|unknown};

// useContractValue is a hook that fetches the value of a contract method. It
// might be better named `useSimulateTransaction`, but not sure which is more clear...
// TODO: Allow user to specify the wallet of the submitter, fees, etc... Maybe
// a separate (lower-level) hook for `useSimulateTransaction` would be cleaner?
export function useContractValue(contractId: string, method: string, ...params: SorobanSdk.xdr.ScVal[]): ContractValue {
  const { activeChain, server } = React.useContext(AppContext);
  const [value, setValue] = React.useState<ContractValue>({ loading: true });

  React.useEffect(() => {
    if (!activeChain) {
      return { error: "No active chain" };
    }

    (async () => {
      setValue({ loading: true });
      try {
        let result = await fetchContractValue(
          server,
          activeChain.networkPassphrase,
          contractId,
          method,
          ...params
        );
        setValue({ result });
      } catch (error) {
        if (typeof error == 'string') {
          setValue({ error });
          return;
        }
        if ('message' in (error as any)) {
          setValue({ error: (error as any).message });
          return;
        }
        setValue({ error });
      }
    })();
  // Have this re-fetch if the contractId/method/params change. Total hack with
  // xdr-base64 to enforce real equality instead of object equality
  // shenanigans.
  }, [contractId, method, ...params.map(p => p.toXDR().toString('base64')), activeChain, server]);
  return value;
};

async function fetchContractValue(server: SorobanSdk.Server, networkPassphrase: string, contractId: string, method: string, ...params: SorobanSdk.xdr.ScVal[]): Promise<SorobanSdk.xdr.ScVal> {
  const contract = new SorobanSdk.Contract(contractId);
  // TODO: Optionally include the wallet of the submitter here, so the
  // simulation is more accurate
  const transaction = new SorobanSdk.TransactionBuilder(source, {
      // fee doesn't matter, we're not submitting
      fee: "100",
      networkPassphrase,
    })
    .addOperation(contract.call(method, ...params))
    .setTimeout(SorobanSdk.TimeoutInfinite)
    .build();

  const { results } = await server.simulateTransaction(transaction);
  if (!results || results.length !== 1) {
    throw new Error("Invalid response from simulateTransaction");
  }
  const result = results[0];
  return xdr.ScVal.fromXDR(Buffer.from(result.xdr, 'base64'));
}
