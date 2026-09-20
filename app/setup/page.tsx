"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { bootstrapSuperAdmin } from "@/lib/actions/bootstrap";

export default function SetupPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [schoolCode, setSchoolCode] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

    async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedFirstName = firstName.trim();
      const normalizedLastName = lastName.trim();

      const signUp = await authClient.signUp.email({
        email: normalizedEmail,
        password,
        name: `${normalizedFirstName} ${normalizedLastName}`,
      });

      if (signUp.error) {
        if (
          signUp.error.code !== "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL"
        ) {
          setError(
            signUp.error.message ||
              "Unable to create the administrator account.",
          );
          return;
        }

        const signIn = await authClient.signIn.email({
          email: normalizedEmail,
          password,
        });

        if (signIn.error) {
          setError(
            signIn.error.message ||
              "This administrator account already exists. Sign in with its password to continue setup.",
          );
          return;
        }
      }

      const result = await bootstrapSuperAdmin({
        schoolName,
        schoolCode,
        firstName: normalizedFirstName,
        lastName: normalizedLastName,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("Unable to complete setup. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <p className="text-sm font-semibold text-slate-500">
            Heisen SchoolOS
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            Initial platform setup
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
            Create the first platform administrator and register your first
            school.
          </p>
        </div>

        <form
          onSubmit={submit}
          className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
        >
          <div className="space-y-8">
            <section>
              <h2 className="text-base font-semibold text-slate-950">
                Administrator
              </h2>

              <div className="mt-4 grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    First name
                  </label>

                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Last name
                  </label>

                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Email address
                  </label>

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Password
                  </label>

                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
                  />

                  <p className="mt-1.5 text-xs text-slate-500">
                    Use at least 8 characters.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-950">
                First school
              </h2>

              <div className="mt-4 grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    School name
                  </label>

                  <input
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    required
                    placeholder="Example Basic School"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    School code
                  </label>

                  <input
                    value={schoolCode}
                    onChange={(e) =>
                      setSchoolCode(e.target.value.toUpperCase())
                    }
                    required
                    placeholder="EBS001"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm uppercase outline-none focus:border-slate-500"
                  />
                </div>
              </div>
            </section>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-slate-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Creating platform…" : "Create platform"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

