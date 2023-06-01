import React, { FunctionComponent, useState, useRef } from 'react'
import { Card, ConnectButton, Loading, ProgressBar } from '../../atoms'
import styles from './style.module.css'
import { Spacer } from '../../atoms/spacer'
import { Utils } from '../../../shared/utils'
import BigNumber from 'bignumber.js';
import {
  useAccount
} from '../../../hooks'

import { useContractValue } from '@soroban-react/contracts'
import * as SorobanClient from 'soroban-client'
import { Deposits, FormPledge } from '../../molecules'
import * as convert from '../../../convert'
import { Constants } from '../../../shared/constants'
import { useSorobanReact } from '@soroban-react/core'
import { useSorobanEvents, EventSubscription } from '@soroban-react/events'
let xdr = SorobanClient.xdr

const Pledge: FunctionComponent = () => {
  const { data: account } = useAccount()
  const sorobanContext = useSorobanReact()
  const sorobanEventsContext = useSorobanEvents()

  const { activeChain } = sorobanContext

  const networkPassphrase = activeChain?.networkPassphrase ?? ''

  // Call the contract rpcs to fetch values
  const useLoadToken = (): any => {
    return {
      balance: useContractValue({ 
        contractId: Constants.TokenId,
        method: 'balance',
        params: [SorobanClient.Address.contract(Buffer.from(Constants.CrowdfundId, 'hex')).toScVal()],
        sorobanContext
      }),

      decimals: useContractValue({ 
        contractId: Constants.TokenId,
        method: 'decimals',
        sorobanContext
      }),

      name: useContractValue({ 
        contractId: Constants.TokenId,
        method: 'name',
        sorobanContext
      }),

      symbol: useContractValue({ 
        contractId: Constants.TokenId,
        method: 'symbol',
        sorobanContext
      }),
    }
  }

  let token = useLoadToken()
  let deadline = useContractValue({ 
    contractId: Constants.CrowdfundId,
    method: 'deadline',
    sorobanContext
  })

  let targetAmountXdr = useContractValue({ 
    contractId: Constants.CrowdfundId,
    method: 'target',
    sorobanContext
  })
 
  // Convert the result ScVals to js types
  const tokenDecimals =
    token.decimals.result && (token.decimals.result?.u32() ?? 7)
  const tokenName =
    token.name.result && convert.scvalToString(token.name.result)
  // asset4 codes seem right-padded with null bytes, so strip those off
  const tokenSymbol =
    token.symbol.result && convert.scvalToString(token.symbol.result)?.replace("\u0000", "")
  const deadlineDate =
    deadline.result &&
    new Date(
      convert.xdrUint64ToNumber(
        deadline.result.u64() ?? xdr.Int64.fromString('0')
      ) * 1000
    )
  const targetAmount = convert.scvalToBigNumber(targetAmountXdr.result)
  
  // hook or event go through same state to update ui
  const [tokenBalance, setTokenBalance] = useState<BigNumber>(BigNumber(0))
  const [targetReached, setTargetReached] = useState<boolean>(false)
 
  React.useEffect(() => {
    // hook is providing data, let it update the ui model, 
    // events will update these later also
    const tokenBalance = convert.scvalToBigNumber(token.balance.result)
    const targetAmount = convert.scvalToBigNumber(targetAmountXdr.result)
    setTokenBalance(tokenBalance)
    setTargetReached(targetAmount.gt(0) && tokenBalance.gte(targetAmount))
  }, [token.balance, targetAmountXdr]);
  
  const isLoading = (): boolean | undefined => {
    return (
      token.balance.loading ||
      token.decimals.loading ||
      token.name.loading ||
      token.symbol.loading ||
      deadline.loading
    )
  }

  const crowdfundPledgedEventSubscription = useRef({
      contractId: Constants.CrowdfundId, 
      topics: ['pledged_amount_changed'], 
      cb: (event: SorobanClient.SorobanRpc.EventResponse): void => {
        let eventTokenBalance = xdr.ScVal.fromXDR(event.value.xdr, 'base64')
        setTokenBalance(convert.scvalToBigNumber(eventTokenBalance))
      }, 
      id: Math.random()} as EventSubscription);

  const crowdfundTargetReachedSubscription = useRef({
      contractId: Constants.CrowdfundId, 
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
      {isLoading() ? (
        <Loading size={64} />
      ) : (
        <>
          {targetReached && (
            <h6>SUCCESSFUL CAMPAIGN !!</h6>
          )}
          <h6>PLEDGED</h6>
          <div className={styles.pledgeAmount}>
            {Utils.formatAmount(tokenBalance, tokenDecimals)} {tokenSymbol}
          </div>
          <span className={styles.pledgeGoal}>{`of ${Utils.formatAmount(
            targetAmount,
            tokenDecimals
          )} ${tokenSymbol} goal`}</span>
          <ProgressBar
            value={Utils.percentage(tokenBalance, targetAmount, tokenDecimals)}
          />
          <div className={styles.wrapper}>
            <div>
              <h6>Time remaining</h6>
              <span className={styles.values}>
                {Utils.getRemainingTime(deadlineDate)}
              </span>
            </div>
            <div>
              <h6>Backers</h6>
              <span className={styles.values}>976</span>
            </div>
          </div>
          <Spacer rem={1.5} />
          {!Utils.isExpired(deadlineDate) &&
            (account ? (
              <FormPledge
                tokenId={Constants.TokenId}
                crowdfundId={Constants.CrowdfundId}
                decimals={tokenDecimals || 7}
                networkPassphrase={networkPassphrase}
                account={account.address}
                symbol={tokenSymbol}
              />
            ) : (
              <ConnectButton label="Connect wallet to pledge" isHigher={true} />
            ))}
          {account && (
            <Deposits
              address={account.address}
              decimals={tokenDecimals || 7}
              name={tokenName}
              symbol={tokenSymbol}
              idCrowdfund={Constants.CrowdfundId}
            />
          )}
        </>
      )}
    </Card>
  )
}

export { Pledge }
