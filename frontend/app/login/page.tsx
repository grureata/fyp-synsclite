"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import { apiRequest, ApiRequestError, User } from "../../lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [registering, setRegistering] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const path = registering ? "/auth/register" : "/auth/login";
      const data = await apiRequest<{ user: User }>(path, {
        method: "POST",
        body: JSON.stringify(registering ? { username, email, password } : { email, password }),
      });
      if (!data.user) throw new Error("The backend response did not include an account.");
      router.push("/dashboard");
    } catch (cause) {
      setError(cause instanceof ApiRequestError || cause instanceof Error
        ? cause.message
        : "Unable to sign in right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />
      <section className="wrap" style={{ maxWidth: 520, paddingTop: 64, paddingBottom: 80 }}>
        <div className="card" style={{ padding: 32 }}>
          <h1 style={{ color: "var(--t1)", fontSize: 26, fontWeight: 800, marginBottom: 8 }}>
            {registering ? "Create your account" : "Welcome back"}
          </h1>
          <p className="body" style={{ marginBottom: 24 }}>
            {registering ? "Create an account to save and view your sessions." : "Sign in to access your session data."}
          </p>
          <form onSubmit={submit} style={{ display: "grid", gap: 16 }}>
            {registering && (
              <label style={{ display: "grid", gap: 6, color: "var(--t3)", fontSize: 13 }}>
                Username
                <input
                  autoComplete="username"
                  minLength={3}
                  maxLength={30}
                  required
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  style={inputStyle}
                />
              </label>
            )}
            <label style={{ display: "grid", gap: 6, color: "var(--t3)", fontSize: 13 }}>
              Email
              <input
                type="email"
                autoComplete="email"
                maxLength={254}
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                style={inputStyle}
              />
            </label>
            <label style={{ display: "grid", gap: 6, color: "var(--t3)", fontSize: 13 }}>
              Password
              <input
                type="password"
                autoComplete={registering ? "new-password" : "current-password"}
                minLength={8}
                maxLength={72}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                style={inputStyle}
              />
            </label>
            {registering && <p className="body" style={{ fontSize: 12 }}>Use at least 8 characters and include a number.</p>}
            {error && <p role="alert" style={{ color: "var(--rose)", fontSize: 13 }}>{error}</p>}
            <button className="btn btn-v" disabled={loading} style={{ justifyContent: "center", padding: 12 }}>
              {loading ? "Please wait…" : registering ? "Create account" : "Sign in"}
            </button>
          </form>
          <p style={{ marginTop: 20, color: "var(--t3)", fontSize: 13 }}>
            {registering ? "Already registered?" : "New to SignSync?"}{" "}
            <button
              type="button"
              onClick={() => { setRegistering((current) => !current); setError(""); }}
              style={{ border: 0, padding: 0, background: "none", color: "var(--v2)", cursor: "pointer" }}
            >
              {registering ? "Sign in" : "Create an account"}
            </button>
          </p>
          <Link href="/" className="footer-link" style={{ display: "inline-block", marginTop: 16 }}>Back home</Link>
        </div>
      </section>
    </main>
  );
}

const inputStyle = {
  width: "100%",
  padding: "11px 14px",
  background: "var(--bg-1)",
  border: "1px solid var(--b)",
  borderRadius: "var(--r)",
  fontSize: 14,
  color: "var(--t1)",
};
