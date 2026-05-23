"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageCircle, Eye, EyeOff, Check, X } from "lucide-react";
import { siteConfig } from "@/config/site";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const PASSWORD_REQUIREMENTS = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "Contains uppercase", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Contains lowercase", test: (p: string) => /[a-z]/.test(p) },
  { label: "Contains number", test: (p: string) => /[0-9]/.test(p) },
];

export default function SignUpPage() {
  const router = useRouter();
  const { signUpWithEmail, signInWithGoogle } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    terms?: string;
  }>({});

  function validate(): boolean {
    const err: typeof fieldErrors = {};
    if (!name.trim()) err.name = "Name is required";
    if (!email) err.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) err.email = "Please enter a valid email";
    if (!password) err.password = "Password is required";
    else if (password.length < 8) err.password = "Password must be at least 8 characters";
    if (!confirmPassword) err.confirmPassword = "Please confirm your password";
    else if (password !== confirmPassword) err.confirmPassword = "Passwords do not match";
    if (!acceptTerms) err.terms = "You must accept the terms and conditions";
    setFieldErrors(err);
    return Object.keys(err).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!validate()) return;

    setLoading(true);
    try {
      const { data, error } = await signUpWithEmail(email, password, name);
      if (error) throw error;
      if (data?.user && data?.session) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setSuccess(true);
      }
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Registration failed. Please try again.";
      setError(msg);
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
            <Check className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
            Check your email
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            We&apos;ve sent a verification link to <strong>{email}</strong>. Click the link to
            activate your account.
          </p>
          <p className="text-sm text-muted-foreground">
            Didn&apos;t receive the email? Check your spam folder or try signing in again.
          </p>
          <p className="mt-8 text-center text-sm text-muted-foreground">
            <Link href="/login" className="text-foreground font-semibold hover:underline">
              Back to sign in
            </Link>
          </p>
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
        Create an account
      </h1>
      <p className="mt-2 text-sm text-muted-foreground text-center">
        Start your free trial. No credit card required.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        {error && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-xl p-3">{error}</p>
        )}

        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            type="text"
            placeholder="John Doe"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            className="h-11 rounded-xl bg-muted/40 border-border/60"
          />
          {fieldErrors.name && (
            <p className="text-sm text-destructive">{fieldErrors.name}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="h-11 rounded-xl bg-muted/40 border-border/60"
          />
          {fieldErrors.email && (
            <p className="text-sm text-destructive">{fieldErrors.email}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
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
                  className={cn(
                    "flex items-center gap-2 text-xs",
                    req.test(password) ? "text-green-500" : "text-muted-foreground"
                  )}
                >
                  {req.test(password) ? <Check className="size-3" /> : <X className="size-3" />}
                  {req.label}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm your password"
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

        <div className="space-y-1">
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded border-border text-primary focus:ring-primary/50"
            />
            <span className="text-sm text-muted-foreground">
              I agree to the{" "}
              <Link href="/terms" className="text-primary hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </span>
          </label>
          {fieldErrors.terms && (
            <p className="text-sm text-destructive">{fieldErrors.terms}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 text-sm font-semibold mt-2"
          disabled={loading}
        >
          {loading ? "Creating account..." : "Create account"}
        </Button>

        <Button
          type="button"
          variant="outline"
          className="w-full h-12 rounded-xl border-border bg-background text-sm font-medium"
          onClick={signInWithGoogle}
          disabled={loading}
        >
          <svg className="size-5 mr-2" viewBox="0 0 24 24" aria-hidden>
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Sign up with Google
        </Button>

      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-foreground font-semibold hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
