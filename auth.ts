import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import {
  users,
  schoolMemberships,
  schools,
  studentUserAccounts,
  students,
} from "@/db/schema";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },

  pages: {
    signIn: "/login",
  },

  providers: [
    Credentials({
      id: "credentials",
      name: "Staff Login",

      credentials: {
        email: {},
        password: {},
      },

      async authorize(credentials) {
        const email =
          typeof credentials?.email === "string"
            ? credentials.email.trim().toLowerCase()
            : "";

        const password =
          typeof credentials?.password === "string"
            ? credentials.password
            : "";

        if (!email || !password) return null;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (!user || user.status !== "active") {
          return null;
        }

        const passwordValid = await bcrypt.compare(
          password,
          user.passwordHash,
        );

        if (!passwordValid) {
          return null;
        }

        const memberships = await db
          .select({
            membershipId: schoolMemberships.id,
            schoolId: schools.id,
            schoolName: schools.name,
            role: schoolMemberships.role,
          })
          .from(schoolMemberships)
          .innerJoin(
            schools,
            eq(
              schoolMemberships.schoolId,
              schools.id,
            ),
          )
          .where(
            and(
              eq(
                schoolMemberships.userId,
                user.id,
              ),
              eq(
                schoolMemberships.isActive,
                true,
              ),
            ),
          );

        if (memberships.length === 0) {
          return null;
        }

        const membership = memberships[0];

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          firstName: user.firstName,
          lastName: user.lastName,
          schoolId: membership.schoolId,
          membershipId: membership.membershipId,
          role: membership.role,
          schoolName: membership.schoolName,
          accountType: "staff",
        };
      },
    }),

    Credentials({
      id: "student-credentials",
      name: "Student Login",

      credentials: {
        email: {},
        password: {},
      },

      async authorize(credentials) {
        const email =
          typeof credentials?.email === "string"
            ? credentials.email.trim().toLowerCase()
            : "";

        const password =
          typeof credentials?.password === "string"
            ? credentials.password
            : "";

        if (!email || !password) {
          return null;
        }

        const [account] = await db
          .select({
            accountId: studentUserAccounts.id,
            studentId: studentUserAccounts.studentId,
            email: studentUserAccounts.email,
            passwordHash:
              studentUserAccounts.passwordHash,
            status: studentUserAccounts.status,
            studentNumber:
              students.studentNumber,
            firstName: students.firstName,
            middleName: students.middleName,
            lastName: students.lastName,
            schoolId: students.schoolId,
          })
          .from(studentUserAccounts)
          .innerJoin(
            students,
            eq(
              studentUserAccounts.studentId,
              students.id,
            ),
          )
          .where(
            eq(
              studentUserAccounts.email,
              email,
            ),
          )
          .limit(1);

        if (!account) {
          return null;
        }

        if (account.status !== "active") {
          return null;
        }

        if (!account.passwordHash) {
          return null;
        }

        const passwordValid =
          await bcrypt.compare(
            password,
            account.passwordHash,
          );

        if (!passwordValid) {
          return null;
        }

        await db
          .update(studentUserAccounts)
          .set({
            lastLoginAt: new Date(),
            updatedAt: new Date(),
          })
          .where(
            eq(
              studentUserAccounts.id,
              account.accountId,
            ),
          );

        return {
          id: account.studentId,
          email: account.email,
          name: [
            account.firstName,
            account.middleName,
            account.lastName,
          ]
            .filter(Boolean)
            .join(" "),
          firstName: account.firstName,
          lastName: account.lastName,
          studentNumber: account.studentNumber,
          schoolId: account.schoolId,
          accountType: "student",
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.accountType = user.accountType;

        if (user.accountType === "student") {
          token.studentNumber =
            user.studentNumber;
          token.schoolId = user.schoolId;
          token.firstName = user.firstName;
          token.lastName = user.lastName;
        } else {
          token.schoolId = user.schoolId;
          token.membershipId =
            user.membershipId;
          token.role = user.role;
          token.firstName = user.firstName;
          token.lastName = user.lastName;
          token.schoolName =
            user.schoolName;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id =
          token.userId as string;

        session.user.accountType =
          token.accountType as
            | "staff"
            | "student";

        session.user.schoolId =
          token.schoolId as string;

        session.user.firstName =
          token.firstName as string;

        session.user.lastName =
          token.lastName as string;

        if (
          token.accountType === "student"
        ) {
          session.user.studentNumber =
            token.studentNumber as string;
        } else {
          session.user.membershipId =
            token.membershipId as string;

          session.user.role =
            token.role as string;

          session.user.schoolName =
            token.schoolName as string;
        }
      }

      return session;
    },
  },
});