export type InstructionStepName = 'install' | 'create' | 'scan';

export interface NetworkDetails {
  network: string;
  networkUrl: string;
  networkPassphrase: string;
}

export type Wallet = {
  id: string;
  name: string;
  shortName?: string;
  iconUrl: string | (() => Promise<string>);
  iconBackground: string;
  installed?: boolean;
  downloadUrls?: {
    android?: string;
    ios?: string;
    browserExtension?: string;
    qrCode?: string;
  };
  isConnected: () => boolean;
  getNetworkDetails: () => Promise<NetworkDetails>;
  getPublicKey: () => Promise<string>;
  signTransaction: (xdr: string, opts?: { network?: string; networkPassphrase?: string; accountToSign?: string }) => Promise<string>;
};

export type WalletList = {
  groupName: string;
  wallets: Wallet[]
}[];
