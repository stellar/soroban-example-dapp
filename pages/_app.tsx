import type { AppProps } from 'next/app'
import '../styles/globals.css'
import {
  ChainMetadata,
  WalletProvider,
  // apiProvider,
  chain,
  getDefaultWallets,
} from "../wallet";

const chains: ChainMetadata[] = [chain.testnet];
const serverUrl = 'https://horizon-testnet.stellar.org';
// const providers = [apiProvider.fallback()];

const { wallets } = getDefaultWallets({
  appName: "Example Stellar App",
  chains
});

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <WalletProvider
      autoconnect
      chains={chains}
      appName={"Example Stellar App"}
      wallets={wallets}
      serverUrl={serverUrl}
      >
      <Component {...pageProps} />
    </WalletProvider>
  );
}

export default MyApp
