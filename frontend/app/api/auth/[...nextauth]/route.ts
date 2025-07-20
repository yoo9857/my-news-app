import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { Account, Profile } from "next-auth"

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
    async jwt({ token, user, account, trigger, session }) {
      // Initial sign in
      if (account && user) {
        let backendUser;
        if (account.provider === "google") {
          const res = await fetch("http://localhost:8002/auth/google", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_token_str: account.id_token }),
          });
          if (res.ok) {
            backendUser = await res.json();
          }
        } else if ((user as any).access_token) {
          backendUser = user;
        }

        if (backendUser && (backendUser as any).access_token) {
          token.accessToken = (backendUser as any).access_token;
          token.email = (backendUser as any).email;
          token.name = (backendUser as any).nickname || (backendUser as any).name;
          token.picture = (backendUser as any).avatar_url || (backendUser as any).picture;
          token.nickname = (backendUser as any).nickname;
          token.avatar_url = (backendUser as any).avatar_url;
          token.user = backendUser;
        }
      }

      // This part runs when the session is updated via the update() function
      if (trigger === "update" && session?.user) {
        if (session.user.nickname !== undefined) token.nickname = session.user.nickname;
        if (session.user.avatar_url !== undefined) token.avatar_url = session.user.avatar_url;
        if (session.user.name !== undefined) token.name = session.user.name;
        if (session.user.email !== undefined) token.email = session.user.email;
        if (session.user.image !== undefined) token.picture = session.user.image;
        token.user = { ...(token.user as object), ...session.user };
      }

      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      
      if (session.user && token) {
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.image = token.picture;
        session.user.nickname = token.nickname;
        session.user.avatar_url = token.avatar_url;
      }

      return session;
    }
  },
  pages: {
    signIn: "/login",
  },
})

export { handler as GET, handler as POST }