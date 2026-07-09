"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Single-user admin login: magic link via Supabase Auth. No password to
// manage, and it reuses the exact auth system the public site will later
// use for real user accounts — no throwaway auth code to rip out.
export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/admin` },
    });
    setStatus(error ? "error" : "sent");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-lg border p-8"
        style={{ background: "var(--panel)", borderColor: "var(--line)" }}
      >
        <h1 className="font-display mb-1 text-2xl" style={{ color: "var(--court)" }}>
          Admin sign in
        </h1>
        <p className="mb-6 text-sm" style={{ color: "var(--court-dim)" }}>
          We&apos;ll email you a one-time link.
        </p>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="mb-4 w-full rounded-md border px-4 py-3 outline-none"
          style={{ background: "var(--panel-raised)", borderColor: "var(--line)", color: "var(--court)" }}
        />
        <button
          type="submit"
          className="w-full rounded-md px-4 py-3 font-medium"
          style={{ background: "var(--accent)", color: "var(--ink)" }}
        >
          Send magic link
        </button>
        {status === "sent" && (
          <p className="mt-4 text-sm" style={{ color: "var(--positive)" }}>
            Check your inbox for the sign-in link.
          </p>
        )}
        {status === "error" && (
          <p className="mt-4 text-sm" style={{ color: "var(--strike)" }}>
            Something went wrong — try again.
          </p>
        )}
      </form>
    </main>
  );
}
