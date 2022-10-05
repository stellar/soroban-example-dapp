import React, { ReactNode } from 'react'
import styles from './style.module.css'

export interface ButtonProps {
  title: string
  onClick: () => void,
  disabled: boolean
}

export function Button({ title, onClick, disabled }: ButtonProps) {
  return (
    <button className={styles.button} onClick={onClick} disabled={disabled}>
      {title}
    </button>
  )
}
