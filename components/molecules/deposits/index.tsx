import React from 'react'
import * as SorobanClient from 'soroban-client'
import styles from './style.module.css'
import { Utils } from '../../../shared/utils'
import BigNumber from 'bignumber.js'
import { Spacer } from '../../atoms/spacer'
import * as convert from '../../../convert'
import { Constants } from '../../../shared/constants'
import { accountIdentifier } from '../../../shared/identifiers'
import {
  ContractValue,
  useContractValue,
} from '../../../wallet'

export interface IDepositsProps {
  address: string
  decimals: number
  name?: string
  symbol?: string
  idCrowdfund: string
}

export function Deposits(props: IDepositsProps) {
  const useLoadDeposits = (): ContractValue => {
    return useContractValue(
      Constants.CrowdfundId,
      'balance',
      accountIdentifier(
        SorobanClient.StrKey.decodeEd25519PublicKey(props.address)
      )
    )
  }

  let yourDepositsXdr = useLoadDeposits()
  const yourDeposits = convert.scvalToBigNumber(yourDepositsXdr.result)

  if (yourDeposits.toNumber() <= 0) {
    return <React.Fragment />
  }

  return (
    <>
      <Spacer rem={2} />
      <h6>You’ve Pledged</h6>
      <div className={styles.pledgeContainer}>
        <span className={styles.values}>
          {Utils.formatAmount(yourDeposits, props.decimals)}{' '}
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
