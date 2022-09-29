import React, { useState } from 'react'
import { Button, Card, Checkbox, Input, ProgressBar } from '../../atoms'
import { TransactionModal } from '../transaction-modal'
import OpenSvg from '../../../assets/icons/open.svg'
import Image from 'next/image'
import styles from './style.module.css'
import { Spacer } from '../../atoms/spacer'

export interface CrowfundProps {
  label?: string
}

export function Pledge({}: CrowfundProps) {
  const [isVisibleModal, setModalVisible] = useState(false)

  const closeModal = (): void => {
    setModalVisible(false)
  }

  const sendPledge = (): void => {
    setModalVisible(true)
  }

  return (
    <Card>
      <h6>PLEDGE</h6>
      <div className={styles.pledgeAmount}>80.000 XLM</div>
      <span className={styles.pledgeGoal}>of 160.000 XLM goal</span>
      <ProgressBar value={60} />
      <div className={styles.wrapper}>
        <div>
          <h6>Time remaining</h6>
          <span className={styles.values}>15 days left</span>
        </div>
        <div>
          <h6>Backers</h6>
          <span className={styles.values}>976</span>
        </div>
      </div>
      <Spacer rem={1.5} />
      <h6>Choose Amount</h6>
      <div className={styles.wrapper}>
        <Checkbox title="100 XLM" />
        <Checkbox title="250 XLM" />
        <Checkbox title="500 XLM" />
        <Checkbox title="1000 XLM" />
      </div>
      <div className={styles.centerContent}>
        <h6>OR</h6>
      </div>
      <Input placeHolder="Custom amount" />
      <Button title="Back this project" onClick={sendPledge} />
      <h6>You’ve Pledged</h6>
      <div className={styles.pledgeContainer}>
        <span className={styles.values}>500.00 XLM</span>
        <a>
          <h6>
            09/22/22 <Image src={OpenSvg} width={12} height={12} alt={'Open'} />
          </h6>
        </a>
      </div>
      {isVisibleModal && (
        <TransactionModal
          value="500.00 XLM"
          status="Successfully pledged"
          closeModal={closeModal}
        />
      )}
    </Card>
  )
}
