import BigNumber from 'bignumber.js'
import React from 'react'
import type { NextPage } from 'next'
import Head from 'next/head'
import * as SorobanSdk from 'soroban-sdk'
import styles from '../styles/Home.module.css'
import * as convert from '../convert'
import {
  ContractValue,
  useNetwork,
  useAccount,
  useContractValue,
  useSendTransaction,
} from '../wallet'
import { Campaign, WalletStatus } from '../components/molecules'
import { Pledge } from '../components/organisms'
let xdr = SorobanSdk.xdr

// Stub dummy data for now.
const CROWDFUND_ID =
  '0000000000000000000000000000000000000000000000000000000000000000'
const TOKEN_ID: string = process.env.TOKEN_ID ?? ''

export interface ITokenData {
  tokenBalance: BigNumber
  tokenDecimals?: number
  tokenName?: string
  tokenSymbol?: string
  deadlineDate?: Date
  startedDate?: Date
  decimals?: number
}

const Home: NextPage = () => {
  const { data: account } = useAccount()
  // Call the contract rpcs to fetch values
  const token = {
    balance: useContractValue(
      TOKEN_ID,
      'balance',
      contractIdentifier(Buffer.from(CROWDFUND_ID, 'hex'))
    ),
    decimals: useContractValue(TOKEN_ID, 'decimals'),
    name: useContractValue(TOKEN_ID, 'name'),
    symbol: useContractValue(TOKEN_ID, 'symbol'),
  }
  const deadline = useContractValue(CROWDFUND_ID, 'deadline')
  const started = useContractValue(CROWDFUND_ID, 'started')

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
  const startedDate =
    started.result &&
    new Date(
      convert.xdrUint64ToNumber(
        started.result.obj()?.u64() ?? xdr.Int64.fromString('0')
      ) * 1000
    )

  return (
    <div className={styles.container}>
      <Head>
        <title>
          Crowdfund Template - An example of how to run a crowdfund campaign on
          Soroban.
        </title>
        <meta
          name="description"
          content="An example of loading information from a soroban smart contract"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className={styles.header}>
        <h1>Crowdfund Template</h1>
        <WalletStatus />
      </header>
      <main className={styles.main}>
        <div className={styles.content}>
          <Campaign />
          <Pledge
            tokenBalance={tokenBalance}
            tokenDecimals={tokenDecimals}
            tokenName={tokenName}
            tokenSymbol={tokenSymbol}
            deadlineDate={deadlineDate}
            startedDate={startedDate}
            decimals={token.decimals.result?.u32()}
          />
        </div>
      </main>
    </div>
  )
}

function formatAmount(value: BigNumber, decimals = 7): string {
  return value.shiftedBy(decimals * -1).toString()
}

function DepositForm({
  account,
  decimals,
}: {
  account: { address: string }
  decimals: number
}) {
  const { activeChain, server } = useNetwork()
  const networkPassphrase = activeChain?.networkPassphrase ?? ''

  let address = 'GBZXN7PIRZGNMHGA7MUUUF4GWPY5AYPV6LY4UV2GL6VJGIQRXFDNMADI'
  let secret = 'SC5O7VZUXDJ6JBDSZ74DSERXL7W3Y5LTOAMRF7RQRL3TAGAPS7LUVG3L'
  const user = accountIdentifier(
    SorobanSdk.StrKey.decodeEd25519PublicKey(address)
  )
  const spender = contractIdentifier(Buffer.from(CROWDFUND_ID, 'hex'))
  const allowanceScval = useContractValue(TOKEN_ID, 'allowance', user, spender)
  const allowance = convert.scvalToBigNumber(allowanceScval.result)

  const [amount, setAmount] = React.useState('')
  const parsedAmount = BigNumber(amount)
  const needsApproval = allowance.eq(0) || allowance.lt(parsedAmount)
  const { sendTransaction } = useSendTransaction()

  const a = async (): Promise<void> => {
    if (!amount) {
      // TODO: Alert here or something
      return
    }
    let { sequence } = await server.getAccount(address)
    let source = new SorobanSdk.Account(address, sequence)
    let from = xdr.ScVal.scvObject(
      xdr.ScObject.scoVec([xdr.ScVal.scvSymbol('Invoker')])
    )
    let nonce = convert.bigNumberToScBigInt(BigNumber(0))
    const amountScVal = convert.bigNumberToScBigInt(
      parsedAmount.multipliedBy(decimals).decimalPlaces(0)
    )
    let txn = needsApproval
      ? contractTransaction(
          networkPassphrase,
          source,
          TOKEN_ID,
          'approve',
          from,
          nonce,
          spender,
          amountScVal
        )
      : contractTransaction(
          networkPassphrase,
          source,
          CROWDFUND_ID,
          'deposit',
          accountIdentifier(SorobanSdk.StrKey.decodeEd25519PublicKey(address)),
          amountScVal
        )
    let result = await sendTransaction(txn)
  }
  // TODO: Check and handle approval
  return (
    <div>
      <input
        name="amount"
        type="text"
        value={amount}
        onChange={e => {
          setAmount(e.currentTarget.value)
        }}
      />
      <button disabled={allowanceScval.loading} onClick={a}>
        {needsApproval ? 'Approve' : 'Deposit'}
      </button>
    </div>
  )
}

function YourDeposits({
  account,
  token,
}: {
  account: { address: string }
  token: {
    decimals: ContractValue
    name: ContractValue
    symbol: ContractValue
  }
}) {
  const yourDepositsXdr = useContractValue(
    CROWDFUND_ID,
    'balance',
    accountIdentifier(SorobanSdk.StrKey.decodeEd25519PublicKey(account.address))
  )

  if (token.decimals.loading || token.name.loading || token.symbol.loading) {
    return <span>Loading...</span>
  }
  if (token.decimals.error || token.name.error || token.symbol.error) {
    return (
      <span>
        {JSON.stringify(
          token.decimals.error || token.name.error || token.symbol.error
        )}
      </span>
    )
  }

  const yourDeposits = convert.scvalToBigNumber(yourDepositsXdr.result)
  const tokenDecimals =
    token.decimals.result && (token.decimals.result?.u32() ?? 7)
  const tokenName =
    token.name.result && convert.scvalToString(token.name.result)
  const tokenSymbol =
    token.symbol.result && convert.scvalToString(token.symbol.result)

  return (
    <span>
      {formatAmount(yourDeposits, tokenDecimals)}{' '}
      <span title={tokenName}>{tokenSymbol}</span>
    </span>
  )
}

// Small helper to build a contract invokation transaction
function contractTransaction(
  networkPassphrase: string,
  source: SorobanSdk.Account,
  contractId: string,
  method: string,
  ...params: SorobanSdk.xdr.ScVal[]
): SorobanSdk.Transaction {
  const contract = new SorobanSdk.Contract(contractId)
  return new SorobanSdk.TransactionBuilder(source, {
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

function contractIdentifier(contract: Buffer): SorobanSdk.xdr.ScVal {
  return xdr.ScVal.scvObject(
    xdr.ScObject.scoVec([
      xdr.ScVal.scvSymbol('Contract'),
      xdr.ScVal.scvObject(xdr.ScObject.scoBytes(contract)),
    ])
  )
}

export default Home
