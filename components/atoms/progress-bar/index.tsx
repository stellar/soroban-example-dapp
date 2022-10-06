import React, { ReactNode } from 'react'
import styles from './style.module.css'

export interface ProgressBarProps {
  value: number
}

export function ProgressBar({ value }: ProgressBarProps) {
  return (
    <div className={styles.progressBarBackground}>
      <div className={styles.progressBar} style={{ width: value + '%' }} />
    </div>
  )
}
