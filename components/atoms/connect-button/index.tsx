import React from 'react'
import { setAllowed } from '@stellar/freighter-api'
import styles from './style.module.css'

export interface ConnectButtonProps {
  label: string
  isHigher?: boolean
}

export function ConnectButton({ label, isHigher }: ConnectButtonProps) {
  return (
    <button
      className={styles.button}
      style={{ height: isHigher ? 50 : 38 }}
      onClick={setAllowed}
    >
      {label}
    </button>
  )
}
