import React from 'react'
import { getPublicKey } from '@stellar/freighter-api'
import styles from './style.module.css'

export interface ConnectButtonProps {
  label: string
  isHigher?: boolean
}

export function ConnectButton({ label, isHigher }: ConnectButtonProps) {
  const openConnectModal = async () => {
    // Freighter currently lacks a way to get the public key without also
    // popping a modal, or open a modal explicitly.
    // See https://github.com/stellar/freighter/issues/830
    //
    // You could work around this by storing some state in localStorage, or you
    // could send a PR to the Freighter team and fix this for everyone who uses
    // Freighter!
    //
    // Eventually, you will want to stop relying on Freighter explicitly,
    // preferring a higher-level wallet/account abstraction that allows users
    // to choose whichever wallet hardware/software they prefer.
    await getPublicKey()
  }

  return (
    <button
      className={styles.button}
      style={{ height: isHigher ? 50 : 38 }}
      onClick={openConnectModal}
    >
      {label}
    </button>
  )
}
