"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SectionHeader } from "@/components/ui/section-header";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleAuth() {
    setError(null);
    setStatus(null);
    setLoading(true);

    const supabase = createClient();
    if (mode === "signup") {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      });
      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (signUpData.session) {
        await fetch("/api/access-requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ note })
        });
      }

      setStatus(
        "Account created. Your access request is pending. Any active team member can approve your request."
      );
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }
      setStatus("Signed in successfully.");
    }

    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <SectionHeader
        title="Team Signup"
        subtitle="Create an account and request access to the shared FLC workspace."
      />

      <Card className="space-y-4">
        <div className="flex gap-2">
          <Button
            variant={mode === "signup" ? "primary" : "secondary"}
            onClick={() => setMode("signup")}
          >
            Sign Up
          </Button>
          <Button
            variant={mode === "signin" ? "primary" : "secondary"}
            onClick={() => setMode("signin")}
          >
            Sign In
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-xs font-medium text-flc-text-muted">
            Email
            <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>

          <label className="space-y-1 text-xs font-medium text-flc-text-muted">
            Password
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
        </div>

        {mode === "signup" ? (
          <div className="space-y-3">
            <label className="space-y-1 text-xs font-medium text-flc-text-muted">
              Full name
              <Input value={fullName} onChange={(event) => setFullName(event.target.value)} />
            </label>
            <label className="space-y-1 text-xs font-medium text-flc-text-muted">
              Why do you need access?
              <Textarea
                rows={3}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Optional note for reviewers."
              />
            </label>
          </div>
        ) : null}

        {error ? <p className="text-sm text-flc-danger">{error}</p> : null}
        {status ? <p className="text-sm text-emerald-700">{status}</p> : null}

        <Button onClick={handleAuth} disabled={loading || !email || !password}>
          {loading ? "Please wait..." : mode === "signup" ? "Create account" : "Sign in"}
        </Button>
      </Card>
    </div>
  );
}
