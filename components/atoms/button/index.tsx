import React, { ReactNode } from 'react'
import { Loading } from '../loading'
import styles from './style.module.css'

export interface ButtonProps {
  title: string
  onClick: () => void
  disabled: boolean
  isLoading: boolean
}

export function Button({ title, onClick, disabled, isLoading }: ButtonProps) {
  return (
    <button className={styles.button} onClick={onClick} disabled={disabled}>
      {isLoading ? <Loading size={18} /> : title}
    </button>
  )
}
