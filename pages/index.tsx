import React from 'react'
import type { NextPage } from 'next'
import Head from 'next/head'
import styles from '../styles/Home.module.css'
import { Campaign, Pledge } from '../components/organisms'
import { WalletData } from '../components/molecules'

const Home: NextPage = () => {
  return (
    <div className={styles.container}>
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
        <h1>Crowdfund Template</h1>
        <WalletData />
      </header>
      <main className={styles.main}>
        <div className={styles.content}>
          <Campaign />
          <Pledge />
        </div>
      </main>
    </div>
  )
}

export default Home
