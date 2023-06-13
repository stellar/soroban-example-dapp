import type { AppProps } from 'next/app'
import '../styles/globals.css'
import AlmostUnnecessaryProvider from '../components/AlmostUnnecessaryProvider';


function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AlmostUnnecessaryProvider>
      <Component {...pageProps} />
    </AlmostUnnecessaryProvider>
  );
}

export default MyApp
