import React from 'react';
import * as SorobanClient from 'soroban-client';
import { SorobanContext, SorobanContextType, defaultSorobanContext } from '.';
import { ConnectorList, NetworkDetails } from "../types";
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

function networkToActiveChain(networkDetails: NetworkDetails | undefined, chains: WalletChain[]) {
  const supported = networkDetails && chains.find(c => c.networkPassphrase === networkDetails?.networkPassphrase)
  const activeChain = networkDetails && {
      id: supported?.id ?? networkDetails.networkPassphrase,
      name: supported?.name ?? networkDetails.network,
      networkPassphrase: networkDetails.networkPassphrase,
      iconBackground: supported?.iconBackground,
      iconUrl: supported?.iconUrl,
      unsupported: !supported,
  }
  return activeChain
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
  const isConnectedRef = React.useRef(false);

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
      let activeChain = networkToActiveChain(networkDetails, chains)

      let address = await mySorobanContext.activeWallet?.getPublicKey()
      let server = networkDetails && new SorobanClient.Server(
        networkDetails.networkUrl,
        { allowHttp: networkDetails.networkUrl.startsWith("http://") }
      )

      // Now we can track that the wallet is finally connected
      isConnectedRef.current = true;
      
      setSorobanContext(c => ({
        ...c,
        activeChain,
        address,
        server,
      }));
    },
    disconnect: async () => {
      isConnectedRef.current = false;
      // TODO: Maybe reset address to undefined
    }
  });

  // Handle changes of address/network in "realtime"
  React.useEffect(() => {
    let timeoutId: NodeJS.Timer | null = null;
    const freighterCheckIntervalMs = 200;

    async function checkForWalletChanges () {
      // Returns if not installed / not active / not connected (TODO: currently always isConnected=true)
      if (!mySorobanContext.activeWallet || !mySorobanContext.activeWallet.isConnected() || !isConnectedRef.current) return;
      let hasNoticedWalletUpdate = false;

      try {
        let chain = networkToActiveChain(await mySorobanContext.activeWallet?.getNetworkDetails(), chains)
        let address = await mySorobanContext.activeWallet?.getPublicKey();

        // No active chain
        if (!chain || !mySorobanContext.activeChain) return;

        if (mySorobanContext.address !== address) {
          console.log("SorobanReactProvider: address changed from:", mySorobanContext.address," to: ", address);
          hasNoticedWalletUpdate = true;
          
          console.log("SorobanReactProvider: reconnecting")
          mySorobanContext.connect();

        } else if (mySorobanContext.activeChain.networkPassphrase != chain.networkPassphrase) {
            console.log(  "SorobanReactProvider: networkPassphrase changed from: ",
                          mySorobanContext.activeChain.networkPassphrase,
                          " to: ",
                          chain.networkPassphrase)
          hasNoticedWalletUpdate = true;

          console.log("SorobanReactProvider: reconnecting")
          mySorobanContext.connect();
        }
      } catch (error) {
        console.error("SorobanReactProvider: error: ", error);
      } finally {
        if (!hasNoticedWalletUpdate) timeoutId = setTimeout(checkForWalletChanges, freighterCheckIntervalMs);
      }
    }

    checkForWalletChanges();

    return () => {
      if (timeoutId != null) clearTimeout(timeoutId);
    }
  }, [mySorobanContext]);

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
