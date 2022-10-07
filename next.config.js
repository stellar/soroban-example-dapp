var fs = require('fs');
/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  env: {
    TOKEN_ID: fs.readFileSync('.soroban/token_id').toString().trim(),
    CROWDFUND_ID: fs.readFileSync('.soroban/crowdfund_id').toString().trim(),
  },
};
