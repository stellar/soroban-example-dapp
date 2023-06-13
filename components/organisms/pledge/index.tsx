import React, { FunctionComponent, useState, useRef } from 'react'
import { Card, ConnectButton, Loading, ProgressBar } from '../../atoms'
import styles from './style.module.css'
import { Spacer } from '../../atoms/spacer'
import { Utils } from '../../../shared/utils'
import {
  useAccount
} from '../../../hooks'
import * as crowdfundContract from 'crowdfund-contract'
import * as abundanceContract from 'abundance-token'

import * as SorobanClient from 'soroban-client'
import { Deposits, FormPledge } from '../../molecules'
import * as convert from '../../../convert'
import { useSorobanEvents, EventSubscription } from '@soroban-react/events'
let xdr = SorobanClient.xdr

const Pledge: FunctionComponent = () => {
  const account = useAccount()
  const sorobanEventsContext = useSorobanEvents()

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
      abundanceContract.balance({ id: crowdfundContract.CONTRACT_ID }),
      abundanceContract.decimals(),
      abundanceContract.name(),
      abundanceContract.symbol(),

      crowdfundContract.deadline(),
      crowdfundContract.target(),
    ]).then(fetched => {
      setAbundance({
        balance: fetched[0],
        decimals: fetched[1],
        name: fetched[2].toString(),
        symbol: fetched[3].toString(),
      })

      setCrowdfund({
        deadline: new Date(Number(fetched[4]) * 1000),
        target: fetched[5],
      })
    })
  }, [])

  const [targetReached, setTargetReached] = useState<boolean>(false)

  // const crowdfundPledgedEventSubscription = useRef({
  //   contractId: crowdfundContract.CONTRACT_ID,
  //   topics: ['pledged_amount_changed'],
  //   cb: (event: SorobanClient.SorobanRpc.EventResponse): void => {
  //     let eventTokenBalance = xdr.ScVal.fromXDR(event.value.xdr, 'base64')
  //     setAbundance({ ...abundance!, balance: convert.scvalToBigInt(eventTokenBalance) })
  //   },
  //   id: Math.random()
  // } as EventSubscription);

  // const crowdfundTargetReachedSubscription = useRef({
  //   contractId: crowdfundContract.CONTRACT_ID,
  //   topics: ['target_reached'],
  //   cb: (event: SorobanClient.SorobanRpc.EventResponse): void => {
  //     setTargetReached(true)
  //   },
  //   id: Math.random()
  // } as EventSubscription);

  // React.useEffect(() => {
  //   const pledgedSubId = sorobanEventsContext.subscribe(crowdfundPledgedEventSubscription.current)
  //   const reachedSubId = sorobanEventsContext.subscribe(crowdfundTargetReachedSubscription.current)

  //   return () => {
  //     sorobanEventsContext.unsubscribe(pledgedSubId);
  //     sorobanEventsContext.unsubscribe(reachedSubId);
  //   }
  // }, [sorobanEventsContext]);

  return (
    <Card>
      {!abundance || !crowdfund ? (
        <Loading size={64} />
      ) : (
        <>
          {targetReached && (
            <h6>SUCCESSFUL CAMPAIGN !!</h6>
          )}
          <h6>PLEDGED</h6>
          <div className={styles.pledgeAmount}>
            {Utils.formatAmount(abundance.balance, abundance.decimals)} {abundance.symbol}
          </div>
          <span className={styles.pledgeGoal}>{`of ${Utils.formatAmount(
            crowdfund.target,
            abundance.decimals
          )} ${abundance.symbol} goal`}</span>
          <ProgressBar
            value={Utils.percentage(abundance.balance, crowdfund.target, abundance.decimals)}
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
              idCrowdfund={crowdfundContract.CONTRACT_ID}
            />
          )}
        </>
      )}
    </Card>
  )
}

export { Pledge }
