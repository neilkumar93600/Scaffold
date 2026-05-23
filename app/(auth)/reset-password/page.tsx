"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MessageCircle,
  Check,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { siteConfig } from "@/config/site";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";

const PASSWORD_REQUIREMENTS = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "Contains uppercase", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Contains lowercase", test: (p: string) => /[a-z]/.test(p) },
  { label: "Contains number", test: (p: string) => /[0-9]/.test(p) },
];

export default function ResetPasswordPage() {
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [tokenExpired, setTokenExpired] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    const check = async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setHasSession(!!session);
      if (!session) setTokenExpired(true);
    };
    check();
  }, []);

  function validate(): boolean {
    const err: { password?: string; confirmPassword?: string } = {};
    if (!password) err.password = "Password is required";
    else if (password.length < 8) err.password = "Password must be at least 8 characters";
    if (!confirmPassword) err.confirmPassword = "Please confirm your password";
    else if (password !== confirmPassword) err.confirmPassword = "Passwords do not match";
    setFieldErrors(err);
    return Object.keys(err).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!validate() || !hasSession) {
      if (!hasSession) setTokenExpired(true);
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await updatePassword(password);
      if (updateError) throw updateError;
      setSuccess(true);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Failed to reset password. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  if (hasSession === null) {
    return (
      <>
        <div className="flex items-center justify-center gap-2 mb-10">
          <MessageCircle className="size-7 text-primary" />
          <span className="text-lg font-semibold text-foreground">{siteConfig.name}</span>
        </div>
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Loading...</h1>
          <p className="text-sm text-muted-foreground">Checking your reset link.</p>
        </div>
      </>
    );
  }

  if (tokenExpired) {
    return (
      <>
        <div className="flex items-center justify-center gap-2 mb-10">
          <MessageCircle className="size-7 text-primary" />
          <span className="text-lg font-semibold text-foreground">{siteConfig.name}</span>
        </div>
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-500/10 mb-6">
            <AlertTriangle className="w-8 h-8 text-orange-500" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
            Link expired
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            This password reset link has expired. Please request a new one.
          </p>
          <Button asChild className="w-full h-12 rounded-xl">
            <Link href="/forgot-password">Request new link</Link>
          </Button>
        </div>
      </>
    );
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
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
            Password reset successful
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            Your password has been updated. You can now sign in with your new password.
          </p>
          <Button
            asChild
            className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 text-sm font-semibold"
          >
            <Link href="/login">Sign in</Link>
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

      <h1 className="text-3xl font-bold tracking-tight text-foreground text-center">
        Create new password
      </h1>
      <p className="mt-2 text-sm text-muted-foreground text-center">
        Enter your new password below. Use at least 8 characters.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        {error && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-xl p-3">{error}</p>
        )}

        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your new password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="h-11 rounded-xl bg-muted/40 border-border/60 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {fieldErrors.password && (
            <p className="text-sm text-destructive">{fieldErrors.password}</p>
          )}
          {password && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              {PASSWORD_REQUIREMENTS.map((req) => (
                <div
                  key={req.label}
                  className={`flex items-center gap-2 text-xs ${
                    req.test(password) ? "text-green-500" : "text-muted-foreground"
                  }`}
                >
                  {req.test(password) ? (
                    <Check className="size-3" />
                  ) : (
                    <span className="size-3 rounded-full border border-current" />
                  )}
                  {req.label}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm new password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm your new password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              className="h-11 rounded-xl bg-muted/40 border-border/60 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
          {fieldErrors.confirmPassword && (
            <p className="text-sm text-destructive">{fieldErrors.confirmPassword}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 text-sm font-semibold"
          disabled={loading}
        >
          {loading ? "Updating..." : "Reset password"}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        <Link href="/login" className="text-foreground font-semibold hover:underline">
          Back to sign in
        </Link>
      </p>
    </>
  );
}
