import * as SorobanClient from 'soroban-client'
let xdr = SorobanClient.xdr

export function accountIdentifier(account: Buffer): SorobanClient.xdr.ScVal {
  return xdr.ScVal.scvObject(
    xdr.ScObject.scoVec([
      xdr.ScVal.scvSymbol('Account'),
      xdr.ScVal.scvObject(
        xdr.ScObject.scoAccountId(xdr.PublicKey.publicKeyTypeEd25519(account))
      ),
    ])
  )
}

export function contractIdentifier(contract: Buffer): SorobanClient.xdr.ScVal {
  return xdr.ScVal.scvObject(
    xdr.ScObject.scoVec([
      xdr.ScVal.scvSymbol('Contract'),
      xdr.ScVal.scvObject(xdr.ScObject.scoBytes(contract)),
    ])
  )
  
}
