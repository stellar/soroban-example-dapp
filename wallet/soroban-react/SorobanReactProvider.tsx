import React, {useEffect} from 'react';
import * as SorobanClient from 'soroban-client';
import { SorobanContext, SorobanContextType, defaultSorobanContext } from '.';
import { ConnectorList } from "../types";
import { WalletChain, } from '../WalletChainContext';
 
/**
 * @param children - A React subtree that needs access to the context.
 */

export interface SorobanReactProviderProps {
  appName?: string;
  autoconnect?: boolean;
  chains: WalletChain[];
  children: React.ReactNode;
  connectors: ConnectorList;
}

export function SorobanReactProvider({
  appName,
  autoconnect = false,
  chains,
  children,
  connectors,
}: SorobanReactProviderProps) {


  const flatWallets = connectors.flatMap(w => w.connectors);
  const activeWallet = flatWallets.length == 1 ? flatWallets[0] : undefined;
  const [mySorobanContext, setSorobanContext] = React.useState<SorobanContextType>({
    ...defaultSorobanContext,
    appName, 
    autoconnect,
    chains,
    connectors,
    activeWallet,
    activeChain: chains.length == 1 ? chains[0] : undefined,
    connect: async () => {
      let networkDetails = await mySorobanContext.activeWallet?.getNetworkDetails()
      const supported = networkDetails && chains.find(c => c.networkPassphrase === networkDetails?.networkPassphrase)
      const activeChain = networkDetails && {
          id: supported?.id ?? networkDetails.networkPassphrase,
          name: supported?.name ?? networkDetails.network,
          networkPassphrase: networkDetails.networkPassphrase,
          iconBackground: supported?.iconBackground,
          iconUrl: supported?.iconUrl,
          unsupported: !supported,
      }
      let address = await mySorobanContext.activeWallet?.getPublicKey()
      let server = networkDetails && new SorobanClient.Server(
        networkDetails.networkUrl,
        { allowHttp: networkDetails.networkUrl.startsWith("http://") }
      )
      setSorobanContext(c => ({
        ...c,
        activeChain,
        address,
        server,
      }));
    },
  });

  React.useEffect(() => {
    console.log("Something changing... in SorobanReactProvider.tsx")
    if (mySorobanContext.address) return;
    if (!mySorobanContext.activeWallet) return;
    if (mySorobanContext.autoconnect || mySorobanContext.activeWallet.isConnected()) {
      mySorobanContext.connect();
    }
  }, [mySorobanContext.address, mySorobanContext.activeWallet, mySorobanContext.autoconnect]);


  return (
    <SorobanContext.Provider value={mySorobanContext}>
      {children}
    </SorobanContext.Provider>
  );
}
