import React, { useEffect, useState } from 'react'
import type { NextPage } from 'next'
import Head from 'next/head'
import styles from '../styles/Home.module.css'
import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/router'
import { FaGoogle, FaTwitter, FaGithub } from 'react-icons/fa'
import * as StellarSdk from '@stellar/stellar-sdk'
import CryptoJS from 'crypto-js'

const Index: NextPage = () => {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [publicKey, setPublicKey] = useState<string | null>(null)
  const [secretKey, setSecretKey] = useState<string | null>(null)
  const [pincode, setPincode] = useState<string>('')

  useEffect(() => {
    if (status !== 'loading' && session) {
      generateKeyPair()
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

  const createAccount = async () => {
    try {
      const response = await fetch(
        `https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey ?? '')}`
      )
      const responseJSON = await response.json()
      console.log('SUCCESS! You have a new account :)\n', responseJSON)
    } catch (e) {
      console.error('ERROR!', e)
    }

    try {
      const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org')
      const parentAccount = await server.loadAccount(publicKey ?? '') // Ensure the parent account exists on the ledger
      const childAccount = StellarSdk.Keypair.random() // Generate a random account to create

      // Create a transaction builder object
      const transactionBuilder = new StellarSdk.TransactionBuilder(parentAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: StellarSdk.Networks.TESTNET,
      })
        .addOperation(
          StellarSdk.Operation.createAccount({
            destination: childAccount.publicKey(),
            startingBalance: '5',
          })
        )
        .setTimeout(180)

      const builtTx = transactionBuilder.build() // Build the transaction

      // Sign the transaction with the parent account's secret key
      builtTx.sign(StellarSdk.Keypair.fromSecret(secretKey ?? ''))

      // Submit the transaction
      const txResponse = await server.submitTransaction(builtTx)
      console.log('Transaction successful!', txResponse)
      console.log('Created the new account', childAccount.publicKey())
    } catch (e) {
      console.error('ERROR during transaction submission!', e)
    }
  }

  const handlePincodeSubmit = () => {
    if (secretKey) {
      const encryptedSecretKey = encryptSecretKey(secretKey, pincode)
      localStorage.setItem('encryptedSecretKey', encryptedSecretKey)
      createAccount();
      alert('Key pair generated and secret key encrypted and stored locally.')
      router.push('/home')
    } else {
      console.error('Secret key is not available')
    }
  }

  return (
    <>
      <Head>
        <title>Soroban Social Login</title>
      </Head>
      <main className={styles.main}>
        <div className={styles.login}>
          <button onClick={() => signIn('google')}>
            <FaGoogle /> Sign in with Google
          </button>
          <button onClick={() => signIn('twitter')}>
            <FaTwitter /> Sign in with Twitter
          </button>
          <button onClick={() => signIn('github')}>
            <FaGithub /> Sign in with GitHub
          </button>
        </div>
        {publicKey && secretKey && (
          <div className={styles.keyPair}>
            <h3>Your Key Pair</h3>
            <p>Public Key: {publicKey}</p>
            <p>Secret Key: {secretKey}</p>
            <div>
              <input
                type="password"
                placeholder="Enter pincode to encrypt your secret key"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
              />
              <button onClick={handlePincodeSubmit}>Submit Pincode</button>
            </div>
          </div>
        )}
      </main>
    </>
  )
}

export default Index
