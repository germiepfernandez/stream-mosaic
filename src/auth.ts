import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Twitch from "next-auth/providers/twitch";

const providers = [];

if (process.env.TWITCH_CLIENT_ID && process.env.TWITCH_CLIENT_SECRET) {
  providers.push(
    Twitch({
      clientId: process.env.TWITCH_CLIENT_ID,
      clientSecret: process.env.TWITCH_CLIENT_SECRET,
      authorization: {
        params: {
          scope: "openid user:read:email user:read:follows",
        },
      },
    }),
  );
}

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/youtube.readonly",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
        token.provider = account.provider;
        token.providerAccountId = account.providerAccountId;
        if (account.provider === "twitch" && profile) {
          const p = profile as { preferred_username?: string; sub?: string };
          token.twitchLogin = p.preferred_username;
          token.twitchUserId = account.providerAccountId ?? p.sub;
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined;
      session.provider = token.provider as string | undefined;
      session.twitchLogin = token.twitchLogin as string | undefined;
      session.twitchUserId = token.twitchUserId as string | undefined;
      return session;
    },
  },
});
