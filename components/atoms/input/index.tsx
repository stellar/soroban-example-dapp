import React, { ReactNode } from 'react'
import styles from './style.module.css'

export interface InputProps {
  placeHolder: string
}

export function Input({ placeHolder }: InputProps) {
  return (
    <input type="text" placeholder={placeHolder} className={styles.input} />
  )
}
