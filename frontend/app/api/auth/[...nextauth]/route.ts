import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      // 백엔드와 사용자 정보 동기화 로직 (선택 사항)
      // 예: 백엔드 API를 호출하여 구글 로그인 사용자 정보를 저장하거나 업데이트
      // const backendResponse = await fetch("http://localhost:8002/api/social-login", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify({
      //     provider: account?.provider,
      //     providerAccountId: account?.id,
      //     email: user.email,
      //     name: user.name,
      //     image: user.image,
      //   }),
      // });
      // if (!backendResponse.ok) {
      //   console.error("Failed to sync user with backend:", await backendResponse.text());
      //   return false;
      // }
      return true;
    },
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin", // 커스텀 로그인 페이지 경로 (선택 사항)
  },
});

export { handler as GET, handler as POST };
