import React, { Dispatch, SetStateAction } from 'react'
import styles from './style.module.css'

export interface InputProps {
  placeHolder: string
  setAmount: Dispatch<SetStateAction<number | undefined>>
  input: string
  setInput: Dispatch<SetStateAction<string>>
}

export function AmountInput({ placeHolder, setAmount, input, setInput }: InputProps) {
  const handleChange = (event: {
    target: { name: string; value: string }
  }): void => {
    setAmount(parseInt(event.target.value))
    setInput(event.target.value)
  }

  return (
    <input
      name="amount"
      type="number"
      placeholder={placeHolder}
      className={styles.input}
      onChange={handleChange}
      value={input}
      min={0}
      autoComplete="off"
    />
  )
}
