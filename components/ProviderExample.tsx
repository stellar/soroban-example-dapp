import React, {useState, useEffect} from 'react'
import {SorobanReactProvider,
        getDefaultConnectors} from '@soroban-react/core';
import {ChainMetadata} from "@soroban-react/types";

import {chain} from '../wallet/provideWalletChains'
      
  const chains: ChainMetadata[] = [chain.sandbox, chain.standalone, chain.futurenet];
  const {connectors} = getDefaultConnectors({
                            appName: "Exanple Stellar App",
                            chains})
                            
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