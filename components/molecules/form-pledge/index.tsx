import React, { FunctionComponent, useState } from 'react'
import { AmountInput, Button, Checkbox } from '../../atoms'
import { TransactionModal } from '../../molecules/transaction-modal'
import styles from './style.module.css'
import {
  useContractValue,
  useNetwork,
  useSendTransaction,
} from '../../../wallet'
import * as SorobanClient from 'soroban-client'
import BigNumber from 'bignumber.js'
import * as convert from '../../../convert'
import { Account } from 'soroban-client'
import { Constants } from '../../../shared/constants'
import { accountIdentifier, contractIdentifier } from '../../../shared/identifiers'
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

  const user = accountIdentifier(
    SorobanClient.StrKey.decodeEd25519PublicKey(props.account)
  )
  const spender = contractIdentifier(Buffer.from(props.crowdfundId, 'hex'))
  const allowanceScval = useContractValue(
    props.tokenId,
    'allowance',
    user,
    spender
  )
  const allowance = convert.scvalToBigNumber(allowanceScval.result)
  const parsedAmount = BigNumber(amount || 0)
  const needsApproval = allowance.eq(0) || allowance.lt(parsedAmount)

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

    let { sequence } = await server.getAccount(props.account)
    let source = new SorobanClient.Account(props.account, sequence)
    let invoker = xdr.ScVal.scvObject(
      xdr.ScObject.scoVec([xdr.ScVal.scvSymbol('Invoker')])
    )
    let nonce = convert.bigNumberToI128(BigNumber(0))
    const amountScVal = convert.bigNumberToI128(
      parsedAmount.shiftedBy(props.decimals).decimalPlaces(0)
    )

    try {
      if (needsApproval) {
        // Approve the transfer first
        await sendTransaction(contractTransaction(
          props.networkPassphrase,
          source,
          props.tokenId,
          'approve',
          invoker,
          nonce,
          spender,
          amountScVal
        ))
      }
      // Deposit the tokens
      let result = await sendTransaction(contractTransaction(
          props.networkPassphrase,
          source,
          props.crowdfundId,
          'deposit',
          accountIdentifier(
            SorobanClient.StrKey.decodeEd25519PublicKey(props.account)
          ),
          amountScVal
        ))
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
        title={needsApproval ? 'Approve transfer & Back this project' : 'Back this project'}
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

  // MintButton mints 100.00 tokens to the user's wallet for testing
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

    // TODO: Check and handle approval
    return (
      <Button
        title={`Mint ${amount.decimalPlaces(decimals).toString()} ${symbol}`}
        onClick={async () => {
          setSubmitting(true)

          if (!server) throw new Error("Not connected to server")

          let { sequence } = await server.getAccount(Constants.TokenAdmin)
          let source = new SorobanClient.Account(Constants.TokenAdmin, sequence)
          let invoker = xdr.ScVal.scvObject(
            xdr.ScObject.scoVec([xdr.ScVal.scvSymbol('Invoker')])
          )
          let nonce = convert.bigNumberToI128(BigNumber(0))
          const recipient = accountIdentifier(
            SorobanClient.StrKey.decodeEd25519PublicKey(account)
          )
          const amountScVal = convert.bigNumberToI128(
            amount.shiftedBy(decimals).decimalPlaces(0)
          )
          let mint = contractTransaction(
            networkPassphrase,
            source,
            props.tokenId,
            'mint',
            invoker,
            nonce,
            recipient,
            amountScVal
          )
          let result = await sendTransaction(mint, { secretKey: Constants.TokenAdminSecretKey })
          // TODO: Show some user feedback while we are awaiting, and then based on the result
          console.debug(result)
          setSubmitting(false)
        }}
        disabled={isSubmitting}
        isLoading={isSubmitting}
      />
    )
  }
}

export { FormPledge }
