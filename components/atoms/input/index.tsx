import React, { Dispatch, ReactNode, SetStateAction } from 'react'
import styles from './style.module.css'

export interface InputProps {
  placeHolder: string
  setAmount: Dispatch<SetStateAction<number | undefined>>
}

export function Input({ placeHolder, setAmount }: InputProps) {
  
  const handleChange = (event: {
    target: { name: string; value: string }
  }): void => {
    if (event.target.value) {
      setAmount(parseInt(event.target.value))
    }
  }

  return (
    <input
      type="number"
      placeholder={placeHolder}
      className={styles.input}
      onChange={handleChange}
      min={0}
    />
  )
}
