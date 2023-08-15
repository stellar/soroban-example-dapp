import React, { useContext } from 'react'
import { getPublicKey } from '@stellar/freighter-api'
import styles from './style.module.css'
import { AccountSetContext, addressToHistoricObject } from '../../../hooks'

export interface ConnectButtonProps {
  label: string
  isHigher?: boolean
}

export function ConnectButton({ label, isHigher }: ConnectButtonProps) {
  let setAccount = useContext(AccountSetContext)

  return (
    <button
      className={styles.button}
      style={{ height: isHigher ? 50 : 38 }}
      onClick={async () => {
          try {
            const pubKey = await getPublicKey()
            
            if (setAccount) {
              setAccount(addressToHistoricObject(pubKey))
            }
          } catch (e) {
            console.error("Error trying to connect wallet.", e)
          }
        }
      }
    >
      {label}
    </button>
  )
}
