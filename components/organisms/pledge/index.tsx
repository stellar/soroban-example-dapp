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
import * as SorobanSdk from 'soroban-sdk'
import { Deposits, FormPledge } from '../../molecules'
import * as convert from '../../../convert'
import { Constants } from '../../../shared/constants'
import {
  accountIdentifier,
  contractIdentifier,
} from '../../../shared/identifiers'
let xdr = SorobanSdk.xdr

const Pledge: FunctionComponent = () => {
  const { data: account } = useAccount()
  const { activeChain } = useNetwork()

  const networkPassphrase = activeChain?.networkPassphrase ?? ''

  // TODO: Stub dummy data for now. replace with freighter wallet account
  const source = new SorobanSdk.Account(Constants.Account, '0')

  // Call the contract rpcs to fetch values
  const useLoadToken = (): any => {
    return {
      balance: useContractValue(
        Constants.TokenId,
        'balance',
        contractIdentifier(Buffer.from(Constants.CrowndfundId, 'hex'))
      ),
      decimals: useContractValue(Constants.TokenId, 'decimals'),
      name: useContractValue(Constants.TokenId, 'name'),
      symbol: useContractValue(Constants.TokenId, 'symbol'),
    }
  }

  const useLoadDeposits = (): ContractValue => {
    return useContractValue(
      Constants.CrowndfundId,
      'balance',
      accountIdentifier(
        SorobanSdk.StrKey.decodeEd25519PublicKey(Constants.Address)
      )
    )
  }

  let token = useLoadToken()
  let yourDepositsXdr = useLoadDeposits()
  let deadline = useContractValue(Constants.CrowndfundId, 'deadline')
  let started = useContractValue(Constants.CrowndfundId, 'started')
  let targetAmountXdr = useContractValue(Constants.CrowndfundId, 'target')

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
  const yourDeposits = convert.scvalToBigNumber(yourDepositsXdr.result)

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
      deadline.loading ||
      yourDepositsXdr.loading
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
                account={account.address}
                tokenId={Constants.TokenId}
                crowdfundId={Constants.CrowndfundId}
                decimals={tokenDecimals || 7}
                networkPassphrase={networkPassphrase}
                source={source}
                address={Constants.Address}
                symbol={tokenSymbol}
              />
            ) : (
              <ConnectButton label="Connect wallet to pledge" isHigher={true} />
            ))}
          {yourDeposits.toNumber() > 0 && (
            <Deposits
              address={Constants.Address}
              decimals={tokenDecimals || 7}
              name={tokenName}
              symbol={tokenSymbol}
              idCrowdfund={Constants.CrowndfundId}
              yourDeposits={yourDeposits}
            />
          )}
        </>
      )}
    </Card>
  )
}

export { Pledge }
