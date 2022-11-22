import React from 'react';
import * as SorobanClient from 'soroban-client';
import { SorobanContext, SorobanContextType, defaultSorobanContext } from '.';
import { WalletList } from "../Wallet";
import { WalletChain, } from '../WalletChainContext';

export interface SorobanReactProviderProps {
  appName?: string;
  autoconnect?: boolean;
  chains: WalletChain[];
  children: React.ReactNode;
  wallets: WalletList;
}

export function SorobanReactProvider({
  appName,
  autoconnect = false,
  chains,
  children,
  wallets,
}: SorobanReactProviderProps) {

  const flatWallets = wallets.flatMap(w => w.wallets);
  const activeWallet = flatWallets.length == 1 ? flatWallets[0] : undefined;
  const [sorobanContext, setSorobanContext] = React.useState<SorobanContextType>({
    ...defaultSorobanContext,
    appName,
    autoconnect,
    chains,
    wallets,
    activeWallet,
    activeChain: chains.length == 1 ? chains[0] : undefined,
    connect: async () => {
      let networkDetails = await sorobanContext.activeWallet?.getNetworkDetails()
      const supported = networkDetails && chains.find(c => c.networkPassphrase === networkDetails?.networkPassphrase)
      const activeChain = networkDetails && {
          id: supported?.id ?? networkDetails.networkPassphrase,
          name: supported?.name ?? networkDetails.network,
          networkPassphrase: networkDetails.networkPassphrase,
          iconBackground: supported?.iconBackground,
          iconUrl: supported?.iconUrl,
          unsupported: !supported,
      }
      let address = await sorobanContext.activeWallet?.getPublicKey()
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
    if (sorobanContext.address) return;
    if (!sorobanContext.activeWallet) return;
    if (sorobanContext.autoconnect || sorobanContext.activeWallet.isConnected()) {
      sorobanContext.connect();
    }
  }, [sorobanContext.address, sorobanContext.activeWallet, sorobanContext.autoconnect]);


  return (
    <SorobanContext.Provider value={sorobanContext}>
      {children}
    </SorobanContext.Provider>
  );
}
