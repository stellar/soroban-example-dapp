import { WalletChain } from './WalletChainContext';
import { ConnectorsList } from './types';
import { freighter } from './connectors';

export const getDefaultWallets = ({
  appName,
  chains,
}: {
  appName: string;
  chains: WalletChain[];
}): {
  connectors: ConnectorsList;
} => {
  const connectors: ConnectorsList = [
    {
      groupName: 'Popular',
      connectors: [
        freighter({ appName, chains }),
      ],
    },
  ];

  return {
    connectors,
  };
};
