import { WalletChain } from './WalletChainContext';
import { WalletList } from './Wallet';
import { freighter } from './connectors';

export const getDefaultWallets = ({
  appName,
  chains,
}: {
  appName: string;
  chains: WalletChain[];
}): {
  wallets: WalletList;
} => {
  const wallets: WalletList = [
    {
      groupName: 'Popular',
      wallets: [
        freighter({ appName, chains }),
      ],
    },
  ];

  return {
    wallets,
  };
};
