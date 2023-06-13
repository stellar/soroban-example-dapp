import React from 'react'
import {SorobanReactProvider} from '@soroban-react/core';
import {SorobanEventsProvider} from '@soroban-react/events';
import {futurenet, sandbox, standalone} from '@soroban-react/chains';
import {freighter} from '@soroban-react/freighter';
import {ChainMetadata, Connector} from "@soroban-react/types";
      
const chains: ChainMetadata[] = [sandbox, standalone, futurenet];
const connectors: Connector[] = [freighter()];
                                           
/**
 * This machinery is needed for @soroban-react/events functionality, which
 * we still need until event subscriptions are moved to the generated libraries.
 */
export default function AlmostUnnecessaryProvider({children}:{children: React.ReactNode}) {
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
