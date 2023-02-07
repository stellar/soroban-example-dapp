import * as SorobanClient from 'soroban-client'
let xdr = SorobanClient.xdr

export function accountAddress(account: string | Buffer): SorobanClient.xdr.ScVal {
  account = typeof account === 'string' ? SorobanClient.StrKey.decodeEd25519PublicKey(account) : account
  return xdr.ScVal.scvObject(
    xdr.ScObject.scoAddress(
      xdr.ScAddress.scAddressTypeAccount(
        xdr.PublicKey.publicKeyTypeEd25519(account)
      )
    )
  )
}

export function contractAddress(contract: string | Buffer): SorobanClient.xdr.ScVal {
  contract = typeof contract === 'string' ? Buffer.from(contract, 'hex') : contract
  return xdr.ScVal.scvObject(
    xdr.ScObject.scoAddress(
      xdr.ScAddress.scAddressTypeContract(
        contract
      )
    )
  )
}
