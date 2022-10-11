import React from 'react';
import * as SorobanClient from 'soroban-client';
import { AppContext, AppContextType, defaultAppContext } from '../AppContext';
import { WalletList } from "../Wallet";
import { WalletChain, } from '../WalletChainContext';

export interface WalletProviderProps {
  appName?: string;
  autoconnect?: boolean;
  chains: WalletChain[];
  children: React.ReactNode;
  wallets: WalletList;
}

export function WalletProvider({
  appName,
  autoconnect = false,
  chains,
  children,
  wallets,
}: WalletProviderProps) {

  const flatWallets = wallets.flatMap(w => w.wallets);
  const activeWallet = flatWallets.length == 1 ? flatWallets[0] : undefined;
  const [appContext, setAppContext] = React.useState<AppContextType>({
    ...defaultAppContext,
    appName,
    autoconnect,
    chains,
    wallets,
    activeWallet,
    activeChain: chains.length == 1 ? chains[0] : undefined,
    connect: async () => {
      let networkDetails = await appContext.activeWallet?.getNetworkDetails()
      const supported = networkDetails && chains.find(c => c.networkPassphrase === networkDetails?.networkPassphrase)
      const activeChain = networkDetails && {
          id: supported?.id ?? networkDetails.networkPassphrase,
          name: supported?.name ?? networkDetails.network,
          networkPassphrase: networkDetails.networkPassphrase,
          iconBackground: supported?.iconBackground,
          iconUrl: supported?.iconUrl,
          unsupported: !supported,
      }
      let address = await appContext.activeWallet?.getPublicKey()
      let server = networkDetails && new SorobanClient.Server(
        networkDetails.networkUrl,
        { allowHttp: networkDetails.networkUrl.startsWith("http://") }
      )
      setAppContext(c => ({
        ...c,
        activeChain,
        address,
        server,
      }));
    },
  });

  React.useEffect(() => {
    if (appContext.address) return;
    if (!appContext.activeWallet) return;
    if (appContext.autoconnect || appContext.activeWallet.isConnected()) {
      appContext.connect();
    }
  }, [appContext.address, appContext.activeWallet, appContext.autoconnect]);


  return (
    <AppContext.Provider value={appContext}>
      {children}
    </AppContext.Provider>
  );
}
