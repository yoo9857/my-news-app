import { DefaultSession, DefaultUser } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    user: {
      id?: string;
      email?: string | null;
      username?: string | null;
      avatar_url?: string | null;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    access_token?: string;
    email?: string | null;
    username?: string | null;
    avatar_url?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    accessToken?: string;
    email?: string | null;
    user?: {
      email?: string | null;
      username?: string | null;
      avatar_url?: string | null;
    };
  }
}
