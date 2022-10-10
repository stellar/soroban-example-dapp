// These were randomly generated from https://laboratory.stellar.org/#account-creator
const TokenAdmin = 'GDT2NORMZF6S2T4PT4OBJJ43OPD3GPRNTJG3WVVFB356TUHWZQMU6C3U'
const TokenAdminSecretKey = 'SAKCFFFNCE7XAWYMYVRZQYKUK6KMUCDIINLWISJYTMYJLNR2QLCDLFVT'

// Contract IDs, set up by ./initialize.sh
const CrowdfundId = process.env.CROWDFUND_ID ?? ''
const TokenId = process.env.TOKEN_ID ?? ''

const Constants = {
  CrowdfundId,
  TokenAdmin,
  TokenAdminSecretKey,
  TokenId,
}

export { Constants }
