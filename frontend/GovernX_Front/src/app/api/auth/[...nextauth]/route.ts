// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import type { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      try {
        const res = await fetch(
          `${process.env.BACKEND_URL}/api/oauth/github/`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: user.email,
              name: user.name,
              oauth_provider: "github",
              role: "admin",
            }),
          },
        );

        if (!res.ok) {
          console.error(
            "Failed to send user data to Django backend:",
            await res.text(),
          );
          return false;
        }

        return true;
      } catch (error) {
        console.error("Error in signIn callback:", error);
        return false;
      }
    },

    async session({ session }) {
      return session;
    },

    async redirect({ url, baseUrl }) {
      // Always redirect to the admin profile page after login
      return `${baseUrl}/role/admin/profile`;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
