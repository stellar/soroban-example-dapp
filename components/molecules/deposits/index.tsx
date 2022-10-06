import React from 'react'
import styles from './style.module.css'
import { Utils } from '../../../shared/utils'
import BigNumber from 'bignumber.js'
import { Spacer } from '../../atoms/spacer'

export interface IDepositsProps {
  address: string
  decimals: number
  name?: string
  symbol?: string
  idCrowdfund: string
  yourDeposits: BigNumber
}

export function Deposits(props: IDepositsProps) {
  return (
    <>
      <Spacer rem={2} />
      <h6>You’ve Pledged</h6>
      <div className={styles.pledgeContainer}>
        <span className={styles.values}>
          {Utils.formatAmount(props.yourDeposits, props.decimals)}{' '}
          <span title={props.name}>{props.symbol}</span>
        </span>
        {/*<a>
          <h6>
            09/22/22 <Image src={OpenSvg} width={12} height={12} alt={'Open'} />
          </h6>
        </a>*/}
      </div>
    </>
  )
}
