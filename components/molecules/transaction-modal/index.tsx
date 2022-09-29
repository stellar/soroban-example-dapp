import React from 'react'
import styles from './style.module.css'
import CongratulationsSvg from '../../../assets/icons/congratulations.svg'
import FacebookSvg from '../../../assets/icons/facebook.svg'
import TwitterSvg from '../../../assets/icons/twitter.svg'
import LinkedinSvg from '../../../assets/icons/linkedin.svg'
import LinkSvg from '../../../assets/icons/link.svg'
import Image from 'next/image'

export interface TransactionModalProps {
  value: string
  status: string
  closeModal: () => void
}

export function TransactionModal({
  value,
  status,
  closeModal,
}: TransactionModalProps) {
  return (
    <div>
      <div className={styles.darkBG} onClick={closeModal} />
      <div className={styles.centered}>
        <div className={styles.modal}>
          <Image src={CongratulationsSvg} width={64} height={64} alt="avatar" />
          <span className={styles.value}>{value}</span>
          <h6>{status}</h6>
          <span className={styles.message}>
            You’re awesome! Thanks for contributing. Spread the word to help
            fund this project!
          </span>
          <div className={styles.socialButtons}>
            <Image
              src={FacebookSvg}
              width={24}
              height={24}
              alt="Share on Facebook"
            />
            <Image
              src={TwitterSvg}
              width={24}
              height={24}
              alt="Share on Twitter"
            />
            <Image
              src={LinkedinSvg}
              width={24}
              height={24}
              alt="Share on LinkedIn"
            />
            <Image src={LinkSvg} width={24} height={24} alt="Copy link" />
          </div>
          <button className={styles.button} onClick={closeModal}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
