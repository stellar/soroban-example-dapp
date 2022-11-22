import {useSorobanReact, SorobanReactProvider } from '../wallet';

import {
    ChainMetadata,
    chain,
    getDefaultWallets,
  } from "../wallet";
  
  const chains: ChainMetadata[] = [chain.sandbox, chain.standalone, chain.futurenet];
  
  const { wallets } = getDefaultWallets({
    appName: "Example Stellar App",
    chains
  }); 

  export default function ProviderExample({children}) {
    return (
      <SorobanReactProvider
        chains={chains}
        appName={"Example Stellar App"}
        wallets={wallets}
        children={children}
        >
      </SorobanReactProvider>
    )
  }