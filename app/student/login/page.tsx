"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";

export default function StudentLoginPage() {
  const router = useRouter();
  const [studentNumber, setStudentNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/student/resolve-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentNumber: studentNumber.trim().toUpperCase(),
          password,
        }),
      });
      const resolved = await response.json();

      if (!response.ok || !resolved.email) {
        setError("Invalid student login details.");
        return;
      }

      const result = await authClient.signIn.email({
        email: resolved.email,
        password,
      });
      if (result.error) {
        setError("Invalid student login details.");
        return;
      }

      router.replace("/student/dashboard");
      router.refresh();
    } catch {
      setError("Invalid student login details.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <form onSubmit={submit} className="auth-card">
        <div className="auth-brand">
          <span className="auth-brand-mark">H</span>
          <div>
            <p className="auth-brand-name">Heisen SMS</p>
            <p className="auth-brand-caption">Ghanaian school management</p>
          </div>
        </div>
        <h1 className="auth-title">Student Portal</h1>
        <p className="auth-description">
          Sign in with your student ID and temporary password. You will set a private password after your first login.
        </p>

        <div className="auth-form">
          <label className="auth-field">
            Student ID
            <input
              type="text"
              value={studentNumber}
              onChange={(event) => setStudentNumber(event.target.value)}
              required
              autoComplete="username"
              placeholder="e.g. PS/2026/001"
            />
          </label>
          <label className="auth-field">
            Temporary password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
            />
          </label>
          {error && <p className="auth-alert">{error}</p>}
          <button type="submit" disabled={loading} className="btn btn-primary auth-submit">
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </div>
        <p className="auth-footer">
          Use the temporary password provided by your school. You must change your password after signing in.
        </p>
      </form>
    </main>
  );
}
