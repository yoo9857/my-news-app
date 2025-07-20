import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string | undefined;
      email?: string | null | undefined;
      username?: string | null | undefined;
      nickname?: string | null | undefined; // Add nickname
      avatar_url?: string | null | undefined; // Add avatar_url
    } & User;
    accessToken?: string; // Add accessToken
  }

  interface User {
    id?: string | undefined;
    email?: string | null | undefined;
    username?: string | null | undefined;
    nickname?: string | null | undefined; // Add nickname
    avatar_url?: string | null | undefined; // Add avatar_url
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string; // Add accessToken to JWT
    nickname?: string | null | undefined; // Add nickname to JWT
    avatar_url?: string | null | undefined; // Add avatar_url to JWT
  }
}