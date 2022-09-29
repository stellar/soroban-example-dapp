import React, { ReactNode } from 'react'
import styles from './style.module.css'

export interface CheckboxProps {
  title: string
}

export function Checkbox({ title }: CheckboxProps) {
  return (
    <label className={styles.label}>
      <input type="checkbox" />
      <span>{title}</span>
    </label>
  )
}
