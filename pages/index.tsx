import React from 'react'
import type { NextPage } from 'next'
import Head from 'next/head'
import styles from '../styles/Home.module.css'
import { Campaign, Pledge } from '../components/organisms'
import { WalletData } from '../components/molecules'

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>
          Crowdfund Template - An example of how to run a crowdfund campaign on
          Soroban.
        </title>
        <meta
          name="description"
          content="An example of loading information from a soroban smart contract"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className={styles.header}>
        <h3>Starfund</h3>
        <WalletData />
      </header>
      <main className={styles.main}>
        <div className={styles.content}>
          <Campaign />
          <Pledge />
        </div>
      </main>
    </>
  )
}

export default Home
