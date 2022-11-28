import React from 'react'
import { useSorobanReact } from '@soroban-react/core'
import styles from './style.module.css'

export interface ConnectButtonProps {
  label: string
  isHigher?: boolean
}

export function ConnectButton({ label, isHigher }: ConnectButtonProps) {
  const { connect } = useSorobanReact()
  const openConnectModal = async () => {
    await connect()
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
