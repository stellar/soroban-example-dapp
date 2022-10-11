import React, { FunctionComponent } from 'react'
import { Card, ConnectButton, Loading, ProgressBar } from '../../atoms'
import styles from './style.module.css'
import { Spacer } from '../../atoms/spacer'
import { Utils } from '../../../shared/utils'
import {
  ContractValue,
  useAccount,
  useContractValue,
  useNetwork,
} from '../../../wallet'
import * as SorobanClient from 'soroban-client'
import { Deposits, FormPledge } from '../../molecules'
import * as convert from '../../../convert'
import { Constants } from '../../../shared/constants'
import {
  accountIdentifier,
  contractIdentifier,
} from '../../../shared/identifiers'
let xdr = SorobanClient.xdr

const Pledge: FunctionComponent = () => {
  const { data: account } = useAccount()
  const { activeChain } = useNetwork()

  const networkPassphrase = activeChain?.networkPassphrase ?? ''

  // Call the contract rpcs to fetch values
  const useLoadToken = (): any => {
    return {
      balance: useContractValue(
        Constants.TokenId,
        'balance',
        contractIdentifier(Buffer.from(Constants.CrowdfundId, 'hex'))
      ),
      decimals: useContractValue(Constants.TokenId, 'decimals'),
      name: useContractValue(Constants.TokenId, 'name'),
      symbol: useContractValue(Constants.TokenId, 'symbol'),
    }
  }

  let token = useLoadToken()
  let deadline = useContractValue(Constants.CrowdfundId, 'deadline')
  let started = useContractValue(Constants.CrowdfundId, 'started')
  let targetAmountXdr = useContractValue(Constants.CrowdfundId, 'target')

  // Convert the result ScVals to js types
  const tokenBalance = convert.scvalToBigNumber(token.balance.result)
  const tokenDecimals =
    token.decimals.result && (token.decimals.result?.u32() ?? 7)
  const tokenName =
    token.name.result && convert.scvalToString(token.name.result)
  const tokenSymbol =
    token.symbol.result && convert.scvalToString(token.symbol.result)
  const deadlineDate =
    deadline.result &&
    new Date(
      convert.xdrUint64ToNumber(
        deadline.result.obj()?.u64() ?? xdr.Int64.fromString('0')
      ) * 1000
    )
  const targetAmount = convert.scvalToBigNumber(targetAmountXdr.result)

  const startedDate =
    started.result &&
    new Date(
      convert.xdrUint64ToNumber(
        started.result.obj()?.u64() ?? xdr.Int64.fromString('0')
      ) * 1000
    )

  const isLoading = (): boolean | undefined => {
    return (
      token.balance.loading ||
      token.decimals.loading ||
      token.name.loading ||
      token.symbol.loading ||
      deadline.loading
    )
  }

  return (
    <Card>
      {isLoading() ? (
        <Loading size={64} />
      ) : (
        <>
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
