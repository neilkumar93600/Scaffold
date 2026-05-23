"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  MessageCircle,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Mail,
} from "lucide-react";
import { siteConfig } from "@/config/site";
import { useAuth } from "@/hooks/use-auth";
import { useAuthStore } from "@/stores/auth.store";
import { createClient } from "@/lib/supabase/client";

type VerificationState = "verifying" | "success" | "expired" | "error" | "pending";

export default function VerifyEmailPage() {
  const { resetPassword } = useAuth();
  const { setUser } = useAuthStore();
  const [state, setState] = useState<VerificationState>("verifying");
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const check = async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        setState("success");
      } else {
        setState("pending");
      }
    };
    check();
  }, [setUser]);

  async function handleResend() {
    if (!userEmail) return;
    setResending(true);
    try {
      await resetPassword(userEmail);
      setResent(true);
    } catch (err) {
      console.error("Failed to resend:", err);
    } finally {
      setResending(false);
    }
  }

  const logoBlock = (
    <div className="flex items-center justify-center gap-2 mb-10">
      <MessageCircle className="size-7 text-primary" />
      <span className="text-lg font-semibold text-foreground">{siteConfig.name}</span>
    </div>
  );

  if (state === "verifying") {
    return (
      <>
        {logoBlock}
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
            Verifying your email...
          </h1>
          <p className="text-sm text-muted-foreground">
            Please wait while we verify your email address.
          </p>
        </div>
      </>
    );
  }

  if (state === "success") {
    return (
      <>
        {logoBlock}
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-6">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
            Email verified!
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            Your email has been successfully verified. You can now access all features of your
            account.
          </p>
          <Button
            asChild
            className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 text-sm font-semibold"
          >
            <Link href="/chat">Go to Chat</Link>
          </Button>
        </div>
      </>
    );
  }

  if (state === "expired") {
    return (
      <>
        {logoBlock}
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-500/10 mb-6">
            <AlertTriangle className="w-8 h-8 text-orange-500" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
            Link expired
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            This verification link has expired. Request a new one below.
          </p>
          {resent ? (
            <p className="flex items-center justify-center gap-2 text-sm text-green-500 mb-4">
              <CheckCircle2 className="size-4" />
              New verification email sent!
            </p>
          ) : (
            <Button
              variant="outline"
              className="w-full h-12 rounded-xl mb-4"
              onClick={handleResend}
              disabled={resending}
            >
              {resending ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="size-4 mr-2" />
                  Resend verification email
                </>
              )}
            </Button>
          )}
          <Link href="/login" className="text-sm text-primary hover:underline">
            Back to sign in
          </Link>
        </div>
      </>
    );
  }

  if (state === "pending") {
    return (
      <>
        {logoBlock}
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
            Check your email
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            Click the link we sent you to verify your email. Then you can sign in.
          </p>
          <Button
            asChild
            className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 text-sm font-semibold"
          >
            <Link href="/login">Go to sign in</Link>
          </Button>
        </div>
      </>
    );
  }

  // Error state
  return (
    <>
      {logoBlock}
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-6">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
          Verification failed
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          We couldn&apos;t verify your email. The link may be invalid or already used.
        </p>
        <Button
          variant="outline"
          className="w-full h-12 rounded-xl mb-4"
          onClick={handleResend}
          disabled={resending || !userEmail}
        >
          {resending ? (
            <>
              <Loader2 className="size-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            "Request new verification email"
          )}
        </Button>
        <p className="text-sm text-muted-foreground">
          Need help?{" "}
          <Link href="/contact" className="text-primary hover:underline">
            Contact support
          </Link>
        </p>
      </div>
    </>
  );
}
