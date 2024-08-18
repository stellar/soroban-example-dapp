import React, { useEffect, useState } from 'react'
import type { NextPage } from 'next'
import Head from 'next/head'
import styles from '../styles/Home.module.css'
import { Campaign, Pledge } from '../components/organisms'
import { WalletData } from '../components/molecules'
import { useSession, signIn, signOut } from 'next-auth/react'
import { useRouter } from 'next/router'
import * as StellarSdk from '@stellar/stellar-sdk'
import CryptoJS from 'crypto-js'
import Image from 'next/image'

const Home: NextPage = () => {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [publicKey, setPublicKey] = useState<string | null>(null)
  const [secretKey, setSecretKey] = useState<string | null>(null)
  const [pincode, setPincode] = useState<string>('')
  const [isKeyPairGenerated, setIsKeyPairGenerated] = useState<boolean>(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen)
  }

  useEffect(() => {
    if (status !== 'loading' && !session) {
      router.push('/')
    }
  }, [session, status, router])

  useEffect(() => {
    if (status !== 'loading' && session) {
      const encryptedSecretKey = localStorage.getItem('encryptedSecretKey')
      if (encryptedSecretKey) {
        setIsKeyPairGenerated(true)
      } else {
        generateKeyPair()
      }
    }
  }, [session, status])

  const generateKeyPair = () => {
    const pair = StellarSdk.Keypair.random()
    setPublicKey(pair.publicKey())
    setSecretKey(pair.secret())
  }

  const encryptSecretKey = (key: string, pincode: string) => {
    return CryptoJS.AES.encrypt(key, pincode).toString()
  }

  const handlePincodeSubmit = () => {
    if (secretKey) {
      const encryptedSecretKey = encryptSecretKey(secretKey, pincode)
      localStorage.setItem('encryptedSecretKey', encryptedSecretKey)
      alert('Key pair generated and secret key encrypted and stored locally.')
      setIsKeyPairGenerated(true)
    }
  }

  if (status === 'loading') {
    return <div>Loading...</div>
  }

  const handleSignout = () => {
    localStorage.clear();
    signOut();
  }

  return (
    <>
      <Head>
        <title>
          Crowdfund Template - An example of how to run a crowdfund campaign on
          Soroban.
        </title>
        <meta
          name="description"
          content="An example of loading information from a stellar smart contract"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className={styles.header}>
        <h3>Starfund</h3>
        <div className={styles.container}>
          <WalletData />
          {session ? (
            <div className={styles.profileBar} onClick={toggleModal}>
              <Image
                src="/profile.png"
                alt="Profile"
                className={styles.profileImage}
                onClick={toggleModal}
                width={500}
                height={500}
              />
              <Image src='/dropdown.svg' alt='click me' width={20} height={20} onClick={toggleModal} /> 

              {isModalOpen && (
                <div className={styles.modalContent}>
                  <span className={styles.modalUserName}>
                    {session.user?.email || session.user?.name}
                  </span>
                  <button
                    onClick={handleSignout}
                    className={styles.signOutButton}
                  >
                    Sign Out
                  </button>
                  <button
                    onClick={toggleModal}
                    className={styles.closeModalButton}
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div>Not signed in</div>
          )}
        </div>
      </header>
      <main className={styles.main}>
        {session && !isKeyPairGenerated && publicKey && secretKey ? (
          <div className={styles.keyPair}>
            <h3>Your Key Pair</h3>
            <p>Public Key: {publicKey}</p>
            <p>Secret Key: {secretKey}</p>
            <div>
              <input
                type="password"
                placeholder="Enter pincode to encrypt your secret key"
                value={pincode}
                onChange={e => setPincode(e.target.value)}
              />
              <button onClick={handlePincodeSubmit}>Submit Pincode</button>
            </div>
          </div>
        ) : (
          <div className={styles.content}>
            <Campaign />
            <Pledge />
          </div>
        )}
      </main>
    </>
  )
}

export default Home
