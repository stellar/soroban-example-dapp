import React, { Dispatch, ReactNode, SetStateAction } from 'react'
import styles from './style.module.css'

export interface CheckboxProps {
  title: string
  value: number
  isChecked: boolean
  setAmount: Dispatch<SetStateAction<number | undefined>>
}

export function Checkbox({
  title,
  value,
  isChecked,
  setAmount,
}: CheckboxProps) {
  const handleCheckBox = (event: {
    target: { checked: any; value: string }
  }) => {
    setAmount(parseInt(event.target.value))
  }

  return (
    <label className={styles.label}>
      <input
        type="checkbox"
        value={value}
        checked={isChecked}
        onChange={handleCheckBox}
      />
      <span>{title}</span>
    </label>
  )
}
