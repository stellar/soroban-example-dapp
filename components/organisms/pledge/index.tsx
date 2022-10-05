import React from 'react'
import { Card, ConnectButton, ProgressBar } from '../../atoms'
import Image from 'next/image'
import styles from './style.module.css'
import { Spacer } from '../../atoms/spacer'
import { OpenSvg } from '../../../assets/icons'
import { ITokenData } from '../../../pages'
import { Utils } from '../../utils/utils'
import { useAccount, useNetwork } from '../../../wallet'
import * as SorobanSdk from 'soroban-sdk'
import { FormPledge } from '../../molecules'

export function Pledge(tokenData: ITokenData) {
  const { data: account } = useAccount()

  const { activeChain } = useNetwork()
  const networkPassphrase = activeChain?.networkPassphrase ?? ''

  // Stub dummy data for now.
  const source = new SorobanSdk.Account(
    'GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGSNFHEYVXM3XOJMDS674JZ',
    '0'
  )

  const CROWDFUND_ID =
    '0000000000000000000000000000000000000000000000000000000000000000'
  const TOKEN_ID: string = process.env.TOKEN_ID ?? ''

  return (
    <Card>
      <h6>PLEDGE</h6>
      <div className={styles.pledgeAmount}>
        {Utils.formatAmount(tokenData.tokenBalance, tokenData.tokenDecimals)}{' '}
        {tokenData.tokenSymbol}
      </div>
      <span className={styles.pledgeGoal}>of 160.000 XLM goal</span>
      <ProgressBar value={(tokenData.tokenBalance.toNumber() / 160000) * 100} />
      <div className={styles.wrapper}>
        <div>
          <h6>Time remaining</h6>
          <span className={styles.values}>
            {Utils.getRemainingTime(tokenData.deadlineDate)}
          </span>
        </div>
        <div>
          <h6>Backers</h6>
          <span className={styles.values}>976</span>
        </div>
      </div>
      <Spacer rem={1.5} />
      {!Utils.isExpired(tokenData.deadlineDate) &&
        (account ? (
          <FormPledge
            account={account.address}
            tokenId={TOKEN_ID}
            crowdfundId={CROWDFUND_ID}
            decimals={tokenData.decimals || 7}
            networkPassphrase={networkPassphrase}
            source={source}
          />
        ) : (
          <ConnectButton label="Connect wallet to pledge" isHigher={true} />
        ))}
      <h6>You’ve Pledged</h6>
      <div className={styles.pledgeContainer}>
        <span className={styles.values}>500.00 XLM</span>
        <a>
          <h6>
            09/22/22 <Image src={OpenSvg} width={12} height={12} alt={'Open'} />
          </h6>
        </a>
      </div>
    </Card>
  )
}
