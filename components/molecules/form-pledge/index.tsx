import React, { useState } from 'react'
import { Button, Checkbox, Input } from '../../atoms'
import { TransactionModal } from '../../molecules/transaction-modal'
import styles from './style.module.css'
import { useContractValue, useSendTransaction } from '../../../wallet'
import * as SorobanSdk from 'soroban-sdk'
import BigNumber from 'bignumber.js'
import * as convert from '../../../convert'
import { Account } from 'soroban-sdk'
let xdr = SorobanSdk.xdr

export interface IFormPledgeProps {
  account: string
  tokenId: string
  crowdfundId: string
  decimals: number
  networkPassphrase: string
  source: Account
}

export interface IResultSubmit {
  status: string
  scVal?: SorobanSdk.xdr.ScVal
  error?: string
  value?: number
}

export function FormPledge(props: IFormPledgeProps) {
  const [amount, setAmount] = useState<number>()
  const [resultSubmit, setResultSubmit] = useState<IResultSubmit | undefined>()

  const user = accountIdentifier(
    SorobanSdk.StrKey.decodeEd25519PublicKey(props.account)
  )
  const spender = xdr.ScVal.scvObject(
    xdr.ScObject.scoVec([
      xdr.ScVal.scvSymbol('Contract'),
      // TODO: Parse this as an address or whatever.
      xdr.ScVal.scvObject(
        xdr.ScObject.scoBytes(Buffer.from(props.crowdfundId, 'hex'))
      ),
    ])
  )
  const allowanceScval = useContractValue(
    props.tokenId,
    'allowance',
    user,
    spender
  )
  const allowance = convert.scvalToBigNumber(allowanceScval.result)

  const { sendTransaction } = useSendTransaction()

  const closeModal = (): void => {
    setResultSubmit(undefined)
  }

  const handleSubmit = async (): Promise<void> => {
    const parsedAmount = BigNumber(amount || 0)
    const needsApproval = allowance.eq(0) || allowance.lt(parsedAmount)

    // TODO: These will change depending on how auth works.
    let accountKey = SorobanSdk.StrKey.decodeEd25519PublicKey(props.account)
    let from = xdr.ScVal.scvObject(xdr.ScObject.scoBytes(accountKey))
    let nonce = xdr.ScVal.scvU32(0)
    const amountScVal = convert.bigNumberToScBigInt(
      parsedAmount.multipliedBy(props.decimals).decimalPlaces(0)
    )
    let txn = needsApproval
      ? contractTransaction(
          props.networkPassphrase,
          props.tokenId,
          'approve',
          from,
          nonce,
          spender,
          amountScVal
        )
      : contractTransaction(
          props.networkPassphrase,
          props.crowdfundId,
          'deposit',
          user,
          amountScVal
        )

    try {
      let result = await sendTransaction(txn)
      setResultSubmit({
        status: 'sucess',
        scVal: result,
        value: amount,
      })
    } catch (e) {
      if (e instanceof Error) {
        setResultSubmit({
          status: 'error',
          error: e?.message || 'An error has occurred',
        })
      }
    }
  }

  // Small helper to build a contract invokation transaction
  function contractTransaction(
    networkPassphrase: string,
    contractId: string,
    method: string,
    ...params: SorobanSdk.xdr.ScVal[]
  ): SorobanSdk.Transaction {
    const contract = new SorobanSdk.Contract(contractId)
    return new SorobanSdk.TransactionBuilder(props.source, {
      // TODO: Figure out the fee
      fee: '100',
      networkPassphrase,
    })
      .addOperation(contract.call(method, ...params))
      .setTimeout(SorobanSdk.TimeoutInfinite)
      .build()
  }

  function accountIdentifier(account: Buffer): SorobanSdk.xdr.ScVal {
    return xdr.ScVal.scvObject(
      xdr.ScObject.scoVec([
        xdr.ScVal.scvSymbol('Account'),
        xdr.ScVal.scvObject(
          xdr.ScObject.scoAccountId(xdr.PublicKey.publicKeyTypeEd25519(account))
        ),
      ])
    )
  }

  return (
    <div>
      <h6>Choose Amount</h6>
      <div className={styles.wrapper}>
        <Checkbox
          title="100 XLM"
          value={100}
          isChecked={amount == 100}
          setAmount={setAmount}
        />
        <Checkbox
          title="250 XLM"
          value={250}
          isChecked={amount == 250}
          setAmount={setAmount}
        />
        <Checkbox
          title="500 XLM"
          value={500}
          isChecked={amount == 500}
          setAmount={setAmount}
        />
        <Checkbox
          title="1000 XLM"
          value={1000}
          isChecked={amount == 1000}
          setAmount={setAmount}
        />
      </div>
      <div className={styles.centerContent}>
        <h6>OR</h6>
      </div>
      <Input placeHolder="Custom amount" setAmount={setAmount} />
      <Button
        title="Back this project"
        onClick={handleSubmit}
        disabled={!amount}
      />
      {resultSubmit && (
        <TransactionModal result={resultSubmit} closeModal={closeModal} />
      )}
    </div>
  )
}
