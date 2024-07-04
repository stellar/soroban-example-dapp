import React, { FunctionComponent, useState } from 'react'
import { Card, ConnectButton, Loading, ProgressBar } from '../../atoms'
import styles from './style.module.css'
import { Spacer } from '../../atoms/spacer'
import { Utils } from '../../../shared/utils'
import { useAccount, useSubscription } from '../../../hooks'
import {
  crowdfund as crowdfundContract,
  abundance as abundanceContract,
} from '../../../shared/contracts'
import { Deposits, FormPledge } from '../../molecules'

const Pledge: FunctionComponent = () => {
  const [updatedAt, setUpdatedAt] = React.useState<number>(Date.now())
  const account = useAccount()

  const [abundance, setAbundance] = React.useState<{
    balance: BigInt
    decimals: number
    name: string
    symbol: string
  }>()

  const [crowdfund, setCrowdfund] = React.useState<{
    deadline: Date
    target: BigInt
  }>()

  React.useEffect(() => {
    Promise.all([
      abundanceContract.balance({ id: crowdfundContract.options.contractId }),
      abundanceContract.decimals(),
      abundanceContract.name(),
      abundanceContract.symbol(),

      crowdfundContract.deadline(),
      crowdfundContract.target(),
    ]).then(fetched => {
      setAbundance({
        balance: fetched[0].result,
        decimals: fetched[1].result,
        name: fetched[2].result.toString(),
        symbol: fetched[3].result.toString(),
      })

      setCrowdfund({
        deadline: new Date(Number(fetched[4].result) * 1000),
        target: fetched[5].result,
      })
    })
  }, [updatedAt])

  const [targetReached, setTargetReached] = useState<boolean>(false)

  useSubscription(
    crowdfundContract.options.contractId,
    'pledged_amount_changed',
    React.useMemo(
      () => event => {
        setAbundance({
          ...abundance!,
          balance: crowdfundContract.spec.funcResToNative(
            'balance',
            event.value
          ),
        })
      },
      [abundance]
    )
  )

  useSubscription(
    crowdfundContract.options.contractId,
    'target_reached',
    React.useMemo(
      () => () => {
        setTargetReached(true)
      },
      []
    )
  )

  return (
    <Card>
      {!abundance || !crowdfund ? (
        <Loading size={64} />
      ) : (
        <>
          {targetReached && <h6>SUCCESSFUL CAMPAIGN !!</h6>}
          <h6>PLEDGED</h6>
          <div className={styles.pledgeAmount}>
            {Utils.formatAmount(abundance.balance, abundance.decimals)}{' '}
            {abundance.symbol}
          </div>
          <span className={styles.pledgeGoal}>{`of ${Utils.formatAmount(
            crowdfund.target,
            abundance.decimals
          )} ${abundance.symbol} goal`}</span>
          <ProgressBar
            value={Utils.percentage(
              abundance.balance,
              crowdfund.target,
              abundance.decimals
            )}
          />
          <div className={styles.wrapper}>
            <div>
              <h6>Time remaining</h6>
              <span className={styles.values}>
                {Utils.getRemainingTime(crowdfund.deadline)}
              </span>
            </div>
            <div>
              <h6>Backers</h6>
              <span className={styles.values}>976</span>
            </div>
          </div>
          <Spacer rem={1.5} />
          {!Utils.isExpired(crowdfund.deadline) &&
            (account ? (
              <FormPledge
                decimals={abundance.decimals || 7}
                account={account.address}
                symbol={abundance.symbol}
                updatedAt={updatedAt}
                onPledge={() => setUpdatedAt(Date.now())}
              />
            ) : (
              <ConnectButton label="Connect wallet to pledge" isHigher={true} />
            ))}
          {account && (
            <Deposits
              address={account.address}
              decimals={abundance.decimals || 7}
              name={abundance.name}
              symbol={abundance.symbol}
            />
          )}
        </>
      )}
    </Card>
  )
}

export { Pledge }
