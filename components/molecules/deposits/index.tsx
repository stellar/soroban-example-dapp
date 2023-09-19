import React from 'react'
import styles from './style.module.css'
import { Utils } from '../../../shared/utils'
import { Spacer } from '../../atoms/spacer'
import { crowdfund } from '../../../shared/contracts'

export interface IDepositsProps {
  address: string
  decimals: number
  name?: string
  symbol?: string
}

export function Deposits(props: IDepositsProps) {
  const [balance, setBalance] = React.useState<BigInt>(BigInt(0))

  React.useEffect(() => {
    crowdfund.balance({ user: props.address }).then(setBalance)
  }, [props.address])


  if (Number(balance) <= 0) {
    return <React.Fragment />
  }

  return (
    <>
      <Spacer rem={2} />
      <h6>You’ve Pledged</h6>
      <div className={styles.pledgeContainer}>
        <span className={styles.values}>
          {Utils.formatAmount(balance, props.decimals)}{' '}
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
