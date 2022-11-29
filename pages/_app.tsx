import type { AppProps } from 'next/app'
import '../styles/globals.css'
import ProviderExample from '../components/ProviderExample';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ProviderExample>
      <Component {...pageProps} />
    </ProviderExample>
  );
}

export default MyApp