import React from 'react'
import { DropdownSvg } from '../../../assets/icons'
import { useAccount, useIsMounted, useNetwork } from '../../../wallet'
import { ConnectButton } from '../../atoms'
import styles from './style.module.css'
import Image from 'next/image'

// TODO: Eliminate flash of unconnected content on loading
export function WalletData() {
  const mounted = useIsMounted()

  const { data: account } = useAccount()

  const { activeChain: chain, chains } = useNetwork()

  const unsupportedChain = chain?.unsupported

  return (
    <>
      {mounted && account ? (
        <div className={styles.displayData}>
          {chain && (chains.length > 1 || unsupportedChain) && (
            <div className={styles.card}>
              {chain.iconUrl && (
                <Image
                  alt={chain.name ?? 'Chain icon'}
                  style={{
                    background: chain.iconBackground,
                  }}
                  height="24"
                  src={chain.iconUrl}
                  width="24"
                />
              )}
              {chain.name ?? chain.id}
            </div>
          )}
          <div className={styles.card}>{account.displayName}</div>
        </div>
      ) : (
        <ConnectButton label="Connect Wallet" />
      )}
    </>
  )
}
