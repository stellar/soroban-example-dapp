import React, { FunctionComponent, useState } from 'react'
import { AmountInput, Button, Checkbox } from '../../atoms'
import { TransactionModal } from '../../molecules/transaction-modal'
import styles from './style.module.css'
import { useSendTransaction } from '@soroban-react/contracts'
import { useSorobanReact } from '@soroban-react/core'
import {
  useNetwork,
} from '../../../wallet'
import * as SorobanClient from 'soroban-client'
import BigNumber from 'bignumber.js'
import * as convert from '../../../convert'
import { Constants } from '../../../shared/constants'
import { Spacer } from '../../atoms/spacer'
let xdr = SorobanClient.xdr

export interface IFormPledgeProps {
  account: string
  tokenId: string
  crowdfundId: string
  decimals: number
  networkPassphrase: string
  symbol?: string
}

export interface IResultSubmit {
  status: string
  scVal?: SorobanClient.xdr.ScVal
  error?: string
  value?: number
  symbol?: string
}

const FormPledge: FunctionComponent<IFormPledgeProps> = props => {
  
  const [amount, setAmount] = useState<number>()
  const [resultSubmit, setResultSubmit] = useState<IResultSubmit | undefined>()
  const [input, setInput] = useState('')
  const [isSubmitting, setSubmitting] = useState(false)
  const { server } = useNetwork()

  const sorobanContext = useSorobanReact()
  const parsedAmount = BigNumber(amount || 0)

  const { sendTransaction } = useSendTransaction()

  const closeModal = (): void => {
    // TODO: Make this reload only the component
    if (resultSubmit?.status == 'success') {
      window.location.reload()
    }
    setResultSubmit(undefined)
  }

  const clearInput = (): void => {
    setInput('')
  }

  const handleSubmit = async (): Promise<void> => {
    setSubmitting(true)

    if (!server) throw new Error("Not connected to server")

    const source = await server.getAccount(props.account)
    const amountScVal = convert.bigNumberToI128(parsedAmount.shiftedBy(7))

    try {
      // Deposit the tokens
      let result = await sendTransaction(
        contractTransaction(
          props.networkPassphrase,
          source,
          props.crowdfundId,
          'deposit',
          new SorobanClient.Address(props.account).toScVal(),
          amountScVal
        ),
        {sorobanContext}
      )
      setResultSubmit({
        status: 'success',
        scVal: result,
        value: amount,
        symbol: props.symbol,
      })
      setInput('')
      setAmount(undefined)
    } catch (e) {
      if (e instanceof Error) {
        setResultSubmit({
          status: 'error',
          error: e?.message || 'An error has occurred',
        })
      } else {
        throw e;
      }
    } finally {
      setSubmitting(false)
    }
  }

  // Small helper to build a contract invokation transaction
  function contractTransaction(
    networkPassphrase: string,
    source: SorobanClient.Account,
    contractId: string,
    method: string,
    ...params: SorobanClient.xdr.ScVal[]
  ): SorobanClient.Transaction {
    const contract = new SorobanClient.Contract(contractId)
    return new SorobanClient.TransactionBuilder(source, {
        // TODO: Figure out the fee
        fee: '100',
        networkPassphrase,
      })
      .addOperation(contract.call(method, ...params))
      .setTimeout(SorobanClient.TimeoutInfinite)
      .build()
  }

  return (
    <div>
      <h6>Choose Amount</h6>
      <div className={styles.wrapper}>
        <Checkbox
          title={`100 ${props.symbol}`}
          value={100}
          isChecked={amount == 100}
          setAmount={setAmount}
          clearInput={clearInput}
        />
        <Checkbox
          title={`250 ${props.symbol}`}
          value={250}
          isChecked={amount == 250}
          setAmount={setAmount}
          clearInput={clearInput}
        />
        <Checkbox
          title={`500 ${props.symbol}`}
          value={500}
          isChecked={amount == 500}
          setAmount={setAmount}
          clearInput={clearInput}
        />
        <Checkbox
          title={`1000 ${props.symbol}`}
          value={1000}
          isChecked={amount == 1000}
          setAmount={setAmount}
          clearInput={clearInput}
        />
      </div>
      <div className={styles.centerContent}>
        <h6>OR</h6>
      </div>
      <AmountInput
        placeHolder="Custom amount"
        setAmount={setAmount}
        input={input}
        setInput={setInput}
      />
      <Button
        title={'Back this project'}
        onClick={handleSubmit}
        disabled={!amount || isSubmitting}
        isLoading={isSubmitting}
      />
      {props.account && props.decimals && props.symbol ? (
        <div>
          <Spacer rem={1} />
          <MintButton
            account={props.account}
            decimals={props.decimals}
            symbol={props.symbol}
          />
        </div>
      ) : null}
      {resultSubmit && (
        <TransactionModal result={resultSubmit} closeModal={closeModal} />
      )}
    </div>
  )

  // MintButton mints 100.0000000 tokens to the user's wallet for testing
  function MintButton({
    account,
    decimals,
    symbol,
  }: {
    account: string
    decimals: number
    symbol: string
  }) {
    const [isSubmitting, setSubmitting] = useState(false)
    const { activeChain, server } = useNetwork()
    const networkPassphrase = activeChain?.networkPassphrase ?? ''

    const { sendTransaction } = useSendTransaction()
    const amount = BigNumber(100)

    return (
      <Button
        title={`Mint ${amount.toString()} ${symbol}`}
        onClick={async () => {
          setSubmitting(true)

          if (!server) throw new Error("Not connected to server")

          const adminSource = await server.getAccount(Constants.TokenAdmin)

          const walletSource = await server.getAccount(account)

          //
          // 1. Establish a trustline to the admin (if necessary)
          // 2. The admin sends us money (mint)
          //
          // We have to do this in two separate transactions because one
          // requires approval from Freighter while the other can be done with
          // the stored token issuer's secret key.
          //
          // FIXME: The `getAccount()` RPC endpoint doesn't return `balances`,
          //        so we never know whether or not the user needs a trustline
          //        to receive the minted asset.
          //
          // Today, we establish the trustline unconditionally.
          try {
            console.log("sorobanContext: ", sorobanContext)
            const trustlineResult = await sendTransaction(
              new SorobanClient.TransactionBuilder(walletSource, {
                networkPassphrase,
                fee: "1000", // arbitrary
              })
              .setTimeout(60)
              .addOperation(
                SorobanClient.Operation.changeTrust({
                  asset: new SorobanClient.Asset(symbol, Constants.TokenAdmin),
                })
              )
              .build(), {
                timeout: 60 * 1000, // should be enough time to approve the tx
                skipAddingFootprint: true, // classic = no footprint
                // omit `secretKey` to have Freighter prompt for signing
                // hence, we need to explicit the sorobanContext
                sorobanContext
              },
            )
            console.debug(trustlineResult)
          } catch (err) {
            console.error(err)
          }

          try {
            const paymentResult = await sendTransaction(
              new SorobanClient.TransactionBuilder(adminSource, {
                networkPassphrase,
                fee: "1000",
              })
              .setTimeout(10)
              .addOperation(
                SorobanClient.Operation.payment({
                  destination: walletSource.accountId(),
                  asset: new SorobanClient.Asset(symbol, Constants.TokenAdmin),
                  amount: amount.toString(),
                })
              )
              .build(), {
                timeout: 10 * 1000,
                skipAddingFootprint: true,
                secretKey: Constants.TokenAdminSecretKey,
                sorobanContext
              }
            )
            console.debug(paymentResult)
          } catch (err) {
            console.error(err)
          }
          //
          // TODO: Show some user feedback while we are awaiting, and then based
          // on the result
          //
          setSubmitting(false)
        }}
        disabled={isSubmitting}
        isLoading={isSubmitting}
      />
    )
  }
}

export { FormPledge }
