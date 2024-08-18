import { SessionProvider } from 'next-auth/react'
import '../styles/globals.css'
import type { AppProps } from 'next/app'
import NextComponentType from 'next/app';

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps & { Component: NextComponentType }) {
  return (
    <SessionProvider session={session}>
      {' '}
      <Component {...pageProps} />{' '}
    </SessionProvider>
  )
}
