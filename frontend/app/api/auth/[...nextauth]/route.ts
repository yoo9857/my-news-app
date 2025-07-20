import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        // Add logic here to look up the user from the credentials provided
        // in your backend authentication service
        const res = await fetch("http://localhost:8002/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            username: credentials?.email || "",
            password: credentials?.password || "",
          }),
        })
        const user = await res.json()

        if (res.ok && user) {
          return user
        } else {
          // If you return null then an error will be displayed advising the user they are not allowed to sign in.
          return null
          // You can also Reject this callback with an Error thus the user will be sent to the error page with the error message as a query parameter
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.access_token
        token.email = user.email // Store email in token
        token.user = user // Store the entire user object in token
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken
      session.user.email = token.email // Ensure email is in session.user
      session.user.username = token.user?.email || token.email // Use email as username if not provided
      session.user.avatar_url = token.user?.avatar_url // Add avatar_url to session.user
      return session
    }
  },
  pages: {
    signIn: "/login",
  },
})

export { handler as GET, handler as POST }