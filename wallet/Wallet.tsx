export type InstructionStepName = 'install' | 'create' | 'scan';

export type ConnectorArgs = {
  chainId?: number;
};

type WalletConnector = {
  mobile?: {
    getUri?: () => Promise<string>;
  };
  desktop?: {
    getUri?: () => Promise<string>;
  };
  qrCode?: {
    getUri: () => Promise<string>;
    instructions?: {
      learnMoreUrl: string;
      steps: {
        step: InstructionStepName;
        title: string;
        description: string;
      }[];
    };
  };
};

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
  getPublicKey: () => Promise<string>;
  signTransaction: (xdr: string, network: string) => Promise<string>;
  createConnector: (connectorArgs: {
    chainId?: number;
  }) => WalletConnector;
};

export type WalletList = {
  groupName: string;
  wallets: Wallet[]
}[];
