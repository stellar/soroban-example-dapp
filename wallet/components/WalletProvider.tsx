import React from 'react';
import * as SorobanSdk from 'soroban-sdk';
import { AppContext, AppContextType, defaultAppContext } from '../AppContext';
import { WalletList } from "../Wallet";
import { WalletChain, } from '../WalletChainContext';

export interface WalletProviderProps {
  appName?: string;
  autoconnect?: boolean;
  chains: WalletChain[];
  children: React.ReactNode;
  serverUrl?: string;
  allowHttp?: boolean;
  wallets: WalletList;
}

export function WalletProvider({
  appName,
  autoconnect = false,
  chains,
  children,
  serverUrl,
  allowHttp = false,
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
    server: new SorobanSdk.Server(serverUrl || "", {allowHttp}),
    connect: async () => {
      let address = await appContext.activeWallet?.getPublicKey();
      setAppContext(c => ({ ...c, address }));
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
