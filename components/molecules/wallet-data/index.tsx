import React, { useContext } from 'react'
import { useIsMounted, addressToHistoricObject, AccountContext } from '../../../hooks'
import { ConnectButton } from '../../atoms'
import styles from './style.module.css'

// TODO: Eliminate flash of unconnected content on loading
export function WalletData() {
  let account = useContext(AccountContext)
  const mounted = useIsMounted()

  return (
    <>
      {mounted && account ? (
        <div className={styles.displayData}>
          <div className={styles.card}>{account.displayName}</div>
        </div>
      ) : (
        <ConnectButton label="Connect Wallet" />
      )}
    </>
  )
}
