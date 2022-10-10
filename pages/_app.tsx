import type { AppProps } from 'next/app'
import '../styles/globals.css'
import {
  ChainMetadata,
  WalletProvider,
  chain,
  getDefaultWallets,
} from "../wallet";

const chains: ChainMetadata[] = [chain.sandbox, chain.standalone, chain.futurenet];

const { wallets } = getDefaultWallets({
  appName: "Example Stellar App",
  chains
});

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <WalletProvider
      chains={chains}
      appName={"Example Stellar App"}
      wallets={wallets}
      >
      <Component {...pageProps} />
    </WalletProvider>
  );
}

export default MyApp
