"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

gsap.registerPlugin(useGSAP);

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AuthError({ error, reset }: ErrorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.error("Auth error:", error);
  }, [error]);

  useGSAP(
    () => {
      gsap.from(containerRef.current, {
        opacity: 0,
        y: 20,
        duration: 0.4,
        ease: "power2.out",
      });

      gsap.from(iconRef.current, {
        scale: 0,
        duration: 0.5,
        delay: 0.1,
        ease: "back.out(1.7)",
      });
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className="text-center space-y-6">
      {/* Error Icon */}
      <div
        ref={iconRef}
        className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center"
      >
        <AlertTriangle className="w-8 h-8 text-destructive" />
      </div>

      {/* Error Message */}
      <div className="space-y-2">
        <h1 className="text-xl font-bold">Authentication Error</h1>
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t complete your request. Please try again.
        </p>
      </div>

      {/* Error Details (development only) */}
      {process.env.NODE_ENV === "development" && error.message && (
        <div className="p-3 rounded-lg bg-muted text-left overflow-auto">
          <p className="text-xs font-mono text-muted-foreground break-all">
            {error.message}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <Button onClick={reset} className="w-full">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
        <Button variant="outline" asChild className="w-full">
          <Link href="/">
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </Link>
        </Button>
      </div>
    </div>
  );
}
