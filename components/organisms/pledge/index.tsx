import React, { FunctionComponent, useState, useRef } from 'react'
import { Card, ConnectButton, Loading, ProgressBar } from '../../atoms'
import styles from './style.module.css'
import { Spacer } from '../../atoms/spacer'
import { Utils } from '../../../shared/utils'
import {
  useAccount
} from '../../../hooks'
import * as crowdfundContract from 'crowdfund-contract'
import * as ftContract from 'ft-contract'

import * as SorobanClient from 'soroban-client'
import { Deposits, FormPledge } from '../../molecules'
import * as convert from '../../../convert'
import { useSorobanEvents, EventSubscription } from '@soroban-react/events'
let xdr = SorobanClient.xdr

const Pledge: FunctionComponent = () => {
  const account = useAccount()
  const sorobanEventsContext = useSorobanEvents()

  const [token, setToken] = React.useState<{
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
      ftContract.balance({ id: crowdfundContract.CONTRACT_ID }),
      ftContract.decimals(),
      ftContract.name(),
      ftContract.symbol(),

      crowdfundContract.deadline(),
      crowdfundContract.target(),
    ]).then(fetched => {
      setToken({
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
  
  const crowdfundPledgedEventSubscription = useRef({
      contractId: crowdfundContract.CONTRACT_ID,
      topics: ['pledged_amount_changed'], 
      cb: (event: SorobanClient.SorobanRpc.EventResponse): void => {
        let eventTokenBalance = xdr.ScVal.fromXDR(event.value.xdr, 'base64')
        setToken({ ...token!, balance: convert.scvalToBigInt(eventTokenBalance) })
      }, 
      id: Math.random()} as EventSubscription);

  const crowdfundTargetReachedSubscription = useRef({
      contractId: crowdfundContract.CONTRACT_ID, 
      topics: ['target_reached'], 
      cb: (event: SorobanClient.SorobanRpc.EventResponse): void => {
        setTargetReached(true)
      }, 
      id: Math.random()} as EventSubscription);
  
  React.useEffect(() => {
    const pledgedSubId = sorobanEventsContext.subscribe(crowdfundPledgedEventSubscription.current)
    const reachedSubId = sorobanEventsContext.subscribe(crowdfundTargetReachedSubscription.current)

    return () => {
      sorobanEventsContext.unsubscribe(pledgedSubId);
      sorobanEventsContext.unsubscribe(reachedSubId);
    }
  }, [sorobanEventsContext]);

  return (
    <Card>
      {!token || !crowdfund ? (
        <Loading size={64} />
      ) : (
        <>
          {targetReached && (
            <h6>SUCCESSFUL CAMPAIGN !!</h6>
          )}
          <h6>PLEDGED</h6>
          <div className={styles.pledgeAmount}>
            {Utils.formatAmount(token.balance, token.decimals)} {token.symbol}
          </div>
          <span className={styles.pledgeGoal}>{`of ${Utils.formatAmount(
            crowdfund.target,
            token.decimals
          )} ${token.symbol} goal`}</span>
          <ProgressBar
            value={Utils.percentage(token.balance, crowdfund.target, token.decimals)}
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
                tokenId={ftContract.CONTRACT_ID}
                crowdfundId={crowdfundContract.CONTRACT_ID}
                decimals={token.decimals || 7}
                networkPassphrase={ftContract.NETWORK_PASSPHRASE}
                account={account.address}
                symbol={token.symbol}
              />
            ) : (
              <ConnectButton label="Connect wallet to pledge" isHigher={true} />
            ))}
          {account && (
            <Deposits
              address={account.address}
              decimals={token.decimals || 7}
              name={token.name}
              symbol={token.symbol}
              idCrowdfund={crowdfundContract.CONTRACT_ID}
            />
          )}
        </>
      )}
    </Card>
  )
}

export { Pledge }
