import React, { FunctionComponent, useState } from 'react'
import { AmountInput, Button, Checkbox } from '../../atoms'
import { TransactionModal } from '../../molecules/transaction-modal'
import { Utils } from '../../../shared/utils'
import styles from './style.module.css'
import * as SorobanClient from 'soroban-client'
import { Constants } from '../../../shared/constants'
import { Spacer } from '../../atoms/spacer'
import { deposit } from 'crowdfund-contract'
import * as ft from 'ft-contract'

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
  error?: string
}

/**
 * Mint 100.0000000 tokens to the user's wallet for testing
 */
function MintButton({ account, symbol }: { account: string; symbol: string }) {
  const [isSubmitting, setSubmitting] = useState(false)

  const amount = BigInt(100)

  return (
    <Button
      title={`Mint ${amount.toString()} ${symbol}`}
      onClick={async () => {
        setSubmitting(true)
        let adminSource, walletSource
        try{
          adminSource = await ft.Server.getAccount(Constants.TokenAdmin)
          walletSource = await ft.Server.getAccount(account)
        }
        catch(error){
          alert("Your wallet or the token admin wallet might not be funded")
          setSubmitting(false)  
          return
        }

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
          console.log("Establishing the trustline...")
          const establishTrustlineTx = await ft.signTx(new SorobanClient.TransactionBuilder(walletSource, {
              networkPassphrase: ft.NETWORK_PASSPHRASE,
              fee: "1000", // arbitrary
            })
            .setTimeout(60)
            .addOperation(
              SorobanClient.Operation.changeTrust({
                asset: new SorobanClient.Asset(symbol, Constants.TokenAdmin),
              })
            )
            .build()
          );
          const trustlineResult = await ft.sendTx(establishTrustlineTx, 60);
          console.debug(trustlineResult)
        } catch (err) {
          console.log("Error while establishing the trustline: ", err)
          console.error(err)
        }

        try {
          console.log("Minting the token...")
          const mintTx = new SorobanClient.TransactionBuilder(adminSource, {
              networkPassphrase: ft.NETWORK_PASSPHRASE,
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
            .build();
          const keypair = SorobanClient.Keypair.fromSecret(Constants.TokenAdminSecretKey);
          mintTx.sign(keypair);
          const mintResult = await ft.sendTx(mintTx);
          console.debug(mintResult)
        } catch (err) {
          console.log("Error while minting the token: ", err)
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

const FormPledge: FunctionComponent<IFormPledgeProps> = props => {
  const [balance, setBalance] = React.useState<BigInt>(BigInt(0))
  const [decimals, setDecimals] = React.useState<number>(0)
  const [symbol, setSymbol] = React.useState<string>()

  const [amount, setAmount] = useState<number>()
  const [resultSubmit, setResultSubmit] = useState<IResultSubmit | undefined>()
  const [input, setInput] = useState('')
  const [isSubmitting, setSubmitting] = useState(false)

  const parsedAmount = BigInt(amount || 0)

  React.useEffect(() => {
    Promise.all([
      ft.balance({ id: props.account }),
      ft.decimals(),
      ft.symbol(),
    ]).then(fetched => {
      setBalance(fetched[0])
      setDecimals(fetched[1])
      setSymbol(fetched[2].toString())
    })
  })

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

    try {
      await deposit({
        user: props.account,
        amount: parsedAmount,
      })

      setResultSubmit({
        status: 'success',
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
            symbol={props.symbol}
          />
          <div className={styles.wrapper}>
            <div>
              <h6>Your balance:  {Utils.formatAmount(balance, decimals)} {symbol}</h6>
          </div>
        </div>
        </div>
      ) : null}
      {resultSubmit && (
        <TransactionModal result={resultSubmit} closeModal={closeModal} />
      )}
    </div>
  )
}

export { FormPledge }
