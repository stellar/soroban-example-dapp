import * as SorobanSdk from 'soroban-sdk'
let xdr = SorobanSdk.xdr

export function accountIdentifier(account: Buffer): SorobanSdk.xdr.ScVal {
  return xdr.ScVal.scvObject(
    xdr.ScObject.scoVec([
      xdr.ScVal.scvSymbol('Account'),
      xdr.ScVal.scvObject(
        xdr.ScObject.scoAccountId(xdr.PublicKey.publicKeyTypeEd25519(account))
      ),
    ])
  )
}

export function contractIdentifier(contract: Buffer): SorobanSdk.xdr.ScVal {
  return xdr.ScVal.scvObject(
    xdr.ScObject.scoVec([
      xdr.ScVal.scvSymbol('Contract'),
      xdr.ScVal.scvObject(xdr.ScObject.scoBytes(contract)),
    ])
  )
  
}
