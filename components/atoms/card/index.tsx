import React, { ReactNode } from 'react'
import styles from './style.module.css'

export interface CardProps {
  children: ReactNode
}

export function Card({ children }: CardProps) {
  return <div className={styles.card}>{children}</div>
}
