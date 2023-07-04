import React from 'react'
import {ChainMetadata, Connector} from "@soroban-react/types";
import {SorobanReactProvider} from '@soroban-react/core';
import {SorobanEventsProvider} from '@soroban-react/events';
import {futurenet, sandbox, standalone} from '@soroban-react/chains';
import {freighter} from '@soroban-react/freighter';
      
const chains: ChainMetadata[] = [sandbox, standalone, futurenet];
const connectors: Connector[] = [freighter()];
                                           
  export default function ProviderExample({children}:{children: React.ReactNode}) {
    return (
      <SorobanReactProvider
        chains={chains}
        appName={"Example Stellar App"}
        connectors={connectors}>
          <SorobanEventsProvider>
          {children}
        </SorobanEventsProvider>
      </SorobanReactProvider>
    )
  }