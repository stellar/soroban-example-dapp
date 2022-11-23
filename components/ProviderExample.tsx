import React, {useState, useEffect} from 'react'
import {useSorobanReact, SorobanReactProvider } from '../wallet';

import {
    ChainMetadata,
    chain,
    getDefaultWallets,
  } from "../wallet";
  
  const chains: ChainMetadata[] = [chain.sandbox, chain.standalone, chain.futurenet];
  const {connectors} = getDefaultWallets({
    appName: "Exanple Stellar App",
    chains
  })
  export default function ProviderExample({children}:{children: React.ReactNode}) {
    return (
      <SorobanReactProvider
        chains={chains}
        appName={"Example Stellar App"}
        connectors={connectors}>
          {children}
      </SorobanReactProvider>
    )
  }