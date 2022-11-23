/* eslint-disable sort-keys-fix/sort-keys-fix */
import freighterApi from "@stellar/freighter-api";
import { WalletChain } from '../../WalletChainContext';
import { NetworkDetails, Connector } from '../../types';

export interface FreighterOptions {
  appName?: string;
  chains: WalletChain[];
}

export function freighter(_: FreighterOptions): Connector {
  return {
    id: 'freighter',
    name: 'Freighter',
    iconUrl: async () => '',
    // iconUrl: async () => (await import('./freighter.svg')).default,
    iconBackground: '#fff',
    // TODO: Check this
    installed: true,
    downloadUrls: {
      browserExtension:
        'https://chrome.google.com/webstore/detail/freighter/bcacfldlkkdogcmkkibnjlakofdplcbk?hl=en',
    },
    isConnected(): boolean {
      return !!freighterApi?.isConnected()
    },
    getNetworkDetails(): Promise<NetworkDetails> {
      return freighterApi.getNetworkDetails()
    },
    getPublicKey(): Promise<string> {
      return freighterApi.getPublicKey()
    },
    signTransaction(xdr: string, opts?: { network?: string; networkPassphrase?: string; accountToSign?: string }): Promise<string> {
      return freighterApi.signTransaction(xdr, opts)
    },
  }
};
