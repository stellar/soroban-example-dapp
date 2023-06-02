import type { AppProps } from 'next/app'
import '../styles/globals.css'

// We still need @soroban-react for events (see pledge/index).
// This will be superseded by the library generated with `soroban contract
// bindings typescript` soon.
import {SorobanReactProvider} from '@soroban-react/core';
import {SorobanEventsProvider} from '@soroban-react/events';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <SorobanReactProvider
        chains={[]}
        appName={"Example Stellar App"}
        connectors={[]}
    >
      <SorobanEventsProvider>
        <Component {...pageProps} />
      </SorobanEventsProvider>
    </SorobanReactProvider>
  );
}

export default MyApp
