import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { db, employees } from "./db";
import { logAuditEvent } from "./lib/audit";

const authSecret =
  process.env.AUTH_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  "enterprise-ai-default-auth-secret-key-32b";

if (!process.env.AUTH_SECRET) {
  process.env.AUTH_SECRET = authSecret;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  secret: authSecret,
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

        const rootAdminEmail = process.env.ROOT_ADMIN_EMAIL?.toLowerCase().trim();
        const isRootAdmin = !!(rootAdminEmail && email.toLowerCase().trim() === rootAdminEmail);
        const assignedRole = isRootAdmin ? "ROOT_ADMIN" : "EMPLOYEE";

        try {
          // Upsert Employee into PostgreSQL based on google_sub
          const [employee] = await db
            .insert(employees)
            .values({
              googleSub,
              email,
              name,
              avatarUrl,
              role: assignedRole,
            })
            .onConflictDoUpdate({
              target: employees.googleSub,
              set: {
                email,
                name,
                avatarUrl,
                ...(isRootAdmin ? { role: "ROOT_ADMIN" } : {}),
              },
            })
            .returning();

          // Append-only AuditLog record with SHA-256 Checksum
          await logAuditEvent({
            actorId: employee.id,
            action: employee.role === "ROOT_ADMIN" ? "ROOT_ADMIN_LOGIN" : "EMPLOYEE_LOGIN",
            targetId: employee.id,
            metadata: {
              method: "google_oauth",
              email: employee.email,
              role: employee.role,
            },
          });

          // Attach database employee id and role to user object
          user.id = employee.id;
          (user as any).role = employee.role;
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
      if ((user as any)?.role) {
        token.role = (user as any).role;
      }
      // Fail-safe check for ROOT_ADMIN_EMAIL in jwt callback
      const rootAdminEmail = process.env.ROOT_ADMIN_EMAIL?.toLowerCase().trim();
      if (rootAdminEmail && token.email && token.email.toLowerCase().trim() === rootAdminEmail) {
        token.role = "ROOT_ADMIN";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        if (token.employeeId) {
          session.user.id = token.employeeId as string;
        }
        (session.user as any).googleSub = token.googleSub as string;
        (session.user as any).role = (token.role as string) || "EMPLOYEE";
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
});
