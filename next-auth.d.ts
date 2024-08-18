import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      name?: string | null
      email?: string | null
      image?: string | null
      publicKey?: string
      secretKey?: string
    }
  }

  interface User {
    publicKey?: string
    secretKey?: string
  }
}
