import type { AppProps } from 'next/app'
import '../styles/globals.css'
import {
  ChainMetadata,
  WalletProvider,
  chain,
  getDefaultWallets,
} from "../wallet";

const chains: ChainMetadata[] = [chain.standalone];
const serverUrl = 'http://localhost:8000/soroban/rpc';

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
      serverUrl={serverUrl}
      allowHttp
      >
      <Component {...pageProps} />
    </WalletProvider>
  );
}

export default MyApp
