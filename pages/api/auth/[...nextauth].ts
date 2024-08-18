import NextAuth, { AuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import TwitterProvider from "next-auth/providers/twitter"
import GithubProvider from "next-auth/providers/github"
import { Keypair } from "@stellar/stellar-sdk"

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID ?? '',
      clientSecret: process.env.TWITTER_CLIENT_SECRET ?? '',
      version: "2.0",
    }),
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID ?? '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? '',
    }),
  ],
  callbacks: {
    async signIn({ user }: { user: any }) {
      // Generate Keypair
      const keypair = Keypair.random()
      user.publicKey = keypair.publicKey()
      user.secretKey = keypair.secret()

      return true
    },
    async jwt({ token, user }: { token: any, user?: any }) {
      if (user) {
        token.publicKey = user.publicKey
        token.secretKey = user.secretKey
      }
      return token
    },
    async session({ session, token }: { session: any, token: any }) {
      session.user.publicKey = token.publicKey
      session.user.secretKey = token.secretKey
      return session
    }
  },
  session: {},
}

export default NextAuth(authOptions)
