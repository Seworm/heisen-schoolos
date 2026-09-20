import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    email?: string | null;
    name?: string | null;

    accountType: "staff" | "student";

    schoolId?: string;

    membershipId?: string;
    role?: string;
    isPlatformAdmin?: boolean;
    schoolName?: string;

    studentNumber?: string;

    firstName: string;
    lastName: string;
  }

  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;

      accountType: "staff" | "student";

      schoolId?: string;

      membershipId?: string;
      role?: string;
      isPlatformAdmin?: boolean;
      schoolName?: string;

      studentNumber?: string;

      firstName: string;
      lastName: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string;
    accountType: "staff" | "student";

    schoolId?: string;

    membershipId?: string;
    role?: string;
    isPlatformAdmin?: boolean;
    schoolName?: string;

    studentNumber?: string;

    firstName: string;
    lastName: string;
  }
}