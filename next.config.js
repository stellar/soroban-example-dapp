var fs = require('fs');
/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  env: {
    CROWDFUND_ID: fs.readFileSync('.soroban/crowdfund_id').toString().trim(),
    TOKEN_ADMIN_ADDRESS: fs.readFileSync('.soroban/token_admin_address').toString().trim(),
    TOKEN_ADMIN_SECRET: fs.readFileSync('.soroban/token_admin_secret').toString().trim(),
    TOKEN_ID: fs.readFileSync('.soroban/token_id').toString().trim(),
  },
};
