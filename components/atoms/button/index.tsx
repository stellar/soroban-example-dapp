import React, { ReactNode } from 'react'
import styles from './style.module.css'

export interface ButtonProps {
  title: string
  onClick: () => void
}

export function Button({ title, onClick }: ButtonProps) {
  return (
    <div className={styles.button} onClick={onClick}>
      {title}
    </div>
  )
}
