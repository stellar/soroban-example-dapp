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
let xdr = SorobanClient.xdr

const pollInterval = 5000

// TODO: update js-soroban-client to include latestLedger
interface GetEventsWithLatestLedger extends SorobanClient.SorobanRpc.GetEventsResponse {
  latestLedger?: string;
}

const Pledge: FunctionComponent = () => {
  const [loadedAt, setLoadedAt] = React.useState<number>(Date.now())
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
  }, [loadedAt])

  const [targetReached, setTargetReached] = useState<boolean>(false)

  const subscriptions: {
    contractId: string
    topics: string[]
    cb: (event: { value: { xdr: string } }) => void
    lastLedgerStart?: number
    pagingToken?: string
  }[] = React.useMemo(() => [
    {
      contractId: crowdfundContract.CONTRACT_ID_HEX,
      topics: ['pledged_amount_changed'],
      cb: (event) => {
        let eventTokenBalance = xdr.ScVal.fromXDR(event.value.xdr, 'base64')
        setAbundance({ ...abundance!, balance: convert.scvalToBigInt(eventTokenBalance) })
      },
    },
    {
      contractId: crowdfundContract.CONTRACT_ID_HEX,
      topics: ['target_reached'],
      cb: () => { setTargetReached(true) },
    },
  ], [abundance, setTargetReached])

  React.useEffect(() => {
    let timeoutId: NodeJS.Timer | null = null
    let stop = false

    async function pollEvents(): Promise<void> {
      try {
        for (const subscription of subscriptions) {
          if (!subscription.lastLedgerStart) {
            let latestLedgerState = await crowdfundContract.Server.getLatestLedger();
            subscription.lastLedgerStart = latestLedgerState.sequence
          } 
         
          const subscriptionTopicXdrs: Array<string> = []
          subscription.topics && subscription.topics.forEach( topic => {
            subscriptionTopicXdrs.push( xdr.ScVal.scvSymbol(topic).toXDR("base64"));
          })

          // TODO: use rpc batch for single round trip, each subscription can be one
          // getEvents request in the batch, is that possible now?
          let response = await crowdfundContract.Server.getEvents({
            startLedger: !subscription.pagingToken ? subscription.lastLedgerStart : undefined,
            cursor: subscription.pagingToken,
            filters: [
              {
                contractIds: [subscription.contractId],
                topics: [subscriptionTopicXdrs],
                type: "contract"
              }  
            ],
            limit: 10
          }) as GetEventsWithLatestLedger;
       
          delete subscription.pagingToken;
          if (response.latestLedger) {
            subscription.lastLedgerStart = parseInt(response.latestLedger);
          }
          response.events && response.events.forEach(event => {
            try {
              subscription.cb(event)
            } catch (error) {
              console.error("Poll Events: subscription callback had error: ", error);
            } finally {
              subscription.pagingToken = event.pagingToken
            }
          }) 
        }   
      } catch (error) {
        console.error("Poll Events: error: ", error);
      } finally {
        if (!stop) {
          timeoutId = setTimeout(pollEvents, pollInterval);
        }
      }
    }

    pollEvents();

    return () => {
      if (timeoutId != null) clearTimeout(timeoutId)
      stop = true
    }
  }, [subscriptions]);


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
                onPledge={() => setLoadedAt(Date.now())}
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
