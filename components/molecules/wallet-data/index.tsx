import React, { useEffect, useState } from 'react'
import { useIsMounted } from '../../../hooks'
import { ConnectButton } from '../../atoms'
import styles from './style.module.css'
import * as StellarSdk from '@stellar/stellar-sdk'
import CryptoJS from 'crypto-js'

export function WalletData() {
  const mounted = useIsMounted()
  const [account, setAccount] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedPublicKey = localStorage.getItem('publicKey')
    if (storedPublicKey) {
      setAccount(storedPublicKey)
      setIsLoading(false)
    } else {
      const encryptedSecretKey = localStorage.getItem('encryptedSecretKey')
      if (encryptedSecretKey) {
        const pincode = prompt('Please enter your pincode to decrypt the secret key:')
        if (pincode) {
          try {
            const bytes = CryptoJS.AES.decrypt(encryptedSecretKey, pincode)
            const decryptedSecretKey = bytes.toString(CryptoJS.enc.Utf8)
            const keypair = StellarSdk.Keypair.fromSecret(decryptedSecretKey)
            const publicKey = keypair.publicKey()
            setAccount(publicKey)
            localStorage.setItem('publicKey', publicKey)
          } catch (error) {
            console.error('Failed to decrypt the secret key:', error)
            alert('Failed to decrypt the secret key. Please check your pincode.')
          }
        }
      }
      setIsLoading(false)
    }
  }, [mounted])

  if (!mounted || isLoading) {
    return null
  }

  return (
    <>
      {account ? (
        <div className={styles.displayData}>
          <div className={styles.card}>{account.slice(0, 12)}</div>
        </div>
      ) : (
        <ConnectButton label="Connect Wallet" />
      )}
    </>
  )
}
