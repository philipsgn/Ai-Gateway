import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { db, employees, auditLogs } from "./db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" && profile) {
        const googleSub = (profile.sub || account.providerAccountId) as string;
        const email = (profile.email || user.email) as string;
        const name = (profile.name || user.name || "") as string;
        const avatarUrl = (profile.picture || user.image || "") as string;

        if (!googleSub || !email) {
          console.error("[Auth] Missing googleSub or email from Google OAuth profile");
          return false;
        }

        try {
          // Upsert Employee into PostgreSQL based on google_sub
          const [employee] = await db
            .insert(employees)
            .values({
              googleSub,
              email,
              name,
              avatarUrl,
              role: "EMPLOYEE",
            })
            .onConflictDoUpdate({
              target: employees.googleSub,
              set: {
                email,
                name,
                avatarUrl,
              },
            })
            .returning();

          // Append-only AuditLog record
          await db.insert(auditLogs).values({
            actorId: employee.id,
            action: "EMPLOYEE_LOGIN",
            targetId: employee.id,
            metadata: {
              method: "google_oauth",
              email: employee.email,
            },
          });

          // Attach database employee id to user object
          user.id = employee.id;
          return true;
        } catch (error) {
          console.error("[Auth] Error upserting employee or recording audit log:", error);
          return false;
        }
      }
      return false;
    },
    async jwt({ token, user, profile, account }) {
      if (account?.provider === "google" && profile) {
        token.googleSub = (profile.sub || account.providerAccountId) as string;
      }
      if (user?.id) {
        token.employeeId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        if (token.employeeId) {
          session.user.id = token.employeeId as string;
        }
        (session.user as any).googleSub = token.googleSub as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
});
