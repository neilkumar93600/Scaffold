"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageCircle, ArrowLeft, Mail } from "lucide-react";
import { siteConfig } from "@/config/site";
import { useAuth } from "@/hooks/use-auth";

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Please enter your email address");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const { error: resetError } = await resetPassword(email);
      if (resetError) throw resetError;
      setSuccess(true);
    } catch (err) {
      console.error("Forgot password error:", err);
      // We still show success to avoid email enumeration
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <>
        <div className="flex items-center justify-center gap-2 mb-10">
          <MessageCircle className="size-7 text-primary" />
          <span className="text-lg font-semibold text-foreground">{siteConfig.name}</span>
        </div>
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-6">
            <Mail className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
            Check your email
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            If an account exists for <strong>{email}</strong>, you&apos;ll receive a password reset
            link shortly.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            The link will expire in 1 hour for security.
          </p>
          <Button asChild variant="outline" className="rounded-xl h-11">
            <Link href="/login" className="inline-flex items-center gap-2">
              <ArrowLeft className="size-4" />
              Back to sign in
            </Link>
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex items-center justify-center gap-2 mb-10">
        <MessageCircle className="size-7 text-primary" />
        <span className="text-lg font-semibold text-foreground">{siteConfig.name}</span>
      </div>

      <Link
        href="/login"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="size-4" />
        Back to sign in
      </Link>

      <h1 className="text-3xl font-bold tracking-tight text-foreground text-center">
        Reset your password
      </h1>
      <p className="mt-2 text-sm text-muted-foreground text-center">
        Enter your email and we&apos;ll send you a link to reset your password.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        {error && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-xl p-3">{error}</p>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
            disabled={loading}
            className="h-11 rounded-xl bg-muted/40 border-border/60"
          />
        </div>

        <Button
          type="submit"
          className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 text-sm font-semibold"
          disabled={loading}
        >
          {loading ? "Sending..." : "Send reset link"}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Remember your password?{" "}
        <Link href="/login" className="text-foreground font-semibold hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
