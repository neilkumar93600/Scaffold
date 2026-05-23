"use client";

import { usePathname } from "next/navigation";
import { EtherealShadow } from "@/components/ui/ethereal-shadow";

const AUTH_PANEL_META: Record<
  string,
  { label: string; headline: string[]; description: string }
> = {
  "/login": {
    label: "Welcome back",
    headline: ["Turn any idea", "into reality"],
    description:
      "Sign in to access your AI workspace — chat, images, video, docs, and more.",
  },
  "/signup": {
    label: "Get started",
    headline: ["Your AI workspace", "starts here"],
    description:
      "Create your account and get access to 200+ AI models, image generation, and autonomous agents.",
  },
  "/forgot-password": {
    label: "Reset password",
    headline: ["We'll get you", "back in"],
    description: "Enter your email and we'll send you a reset link.",
  },
  "/reset-password": {
    label: "New password",
    headline: ["Set a new", "password"],
    description: "Choose a strong password to secure your DevOS AI account.",
  },
  "/verify-email": {
    label: "Verify email",
    headline: ["Check your", "inbox"],
    description:
      "We've sent a verification link. Click it to activate your DevOS AI account.",
  },
};

const DEFAULT_META = AUTH_PANEL_META["/login"];

/* Auth panel uses primary/secondary tokens for all theme modes */
export function AuthLeftPanel() {
  const pathname = usePathname();
  const meta = AUTH_PANEL_META[pathname] ?? DEFAULT_META;

  return (
    <div className="absolute inset-0 overflow-hidden font-sans isolate">
      {/* Background layers — explicit z-0 so text sits above */}
      <div className="absolute inset-0 z-0">
        <EtherealShadow
          title=""
          className="absolute inset-0 h-full w-full"
          color="rgba(147, 109, 255, 0.4)"
          sizing="fill"
          animation={{ scale: 100, speed: 90 }}
          noise={{ opacity: 0.08, scale: 1.2 }}
          style={{
            background:
              "linear-gradient(135deg, rgba(22,19,22,0.96) 0%, rgba(22,19,22,0.98) 30%, rgba(22,19,22,0.92) 60%, rgba(22,19,22,0.98) 100%)",
          }}
        />
        {/* Animated gradient layer - primary + secondary */}
        <div
          className="absolute inset-0 animate-auth-gradient bg-size-[200%_200%] opacity-90"
          aria-hidden
          style={{
            backgroundImage:
              "linear-gradient(125deg, rgba(147,109,255,0.35) 0%, transparent 30%, rgba(84,163,136,0.24) 55%, transparent 80%, rgba(147,109,255,0.3) 100%)",
          }}
        />
        <div className="absolute inset-0 overflow-hidden" aria-hidden>
          <div
            className="absolute w-[60%] aspect-square rounded-full blur-3xl animate-auth-blob opacity-30"
            style={{ top: "10%", left: "-10%", background: "rgba(147,109,255,0.78)" }}
          />
          <div
            className="absolute w-[50%] aspect-square rounded-full blur-3xl animate-auth-blob opacity-25"
            style={{
              top: "50%",
              right: "-5%",
              animationDelay: "-4s",
              background: "rgba(84,163,136,0.7)",
            }}
          />
          <div
            className="absolute w-[45%] aspect-square rounded-full blur-3xl animate-auth-blob opacity-20"
            style={{
              bottom: "10%",
              left: "20%",
              animationDelay: "-8s",
              background: "rgba(147,109,255,0.65)",
            }}
          />
        </div>
        <div
          className="absolute inset-0 opacity-80 pointer-events-none"
          aria-hidden
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 20% 40%, rgba(147,109,255,0.35) 0%, transparent 55%), radial-gradient(ellipse 60% 80% at 80% 60%, rgba(84,163,136,0.25) 0%, transparent 55%), radial-gradient(ellipse 70% 60% at 50% 80%, rgba(22,19,22,0.88) 0%, transparent 60%)",
          }}
        />
      </div>
      {/* Text content — above background with explicit z-10 and contrast */}
      <div className="relative z-10 flex h-full flex-col justify-between px-10 xl:px-16 py-12">
        {/* Label - top */}
        <div className="flex items-center gap-3">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary whitespace-nowrap [text-shadow:0_0_20px_rgba(0,0,0,0.7)]">
            {meta.label}
          </p>
          <span className="h-px w-12 bg-secondary/70 shrink-0" />
        </div>

        {/* Headline + description - bottom */}
        <div>
          <h2 className="text-5xl xl:text-6xl 2xl:text-7xl font-semibold text-primary-foreground leading-[1.1] tracking-tight [text-shadow:0_0_30px_rgba(0,0,0,0.6),0_2px_4px_rgba(0,0,0,0.4)]">
            {meta.headline.map((line, i) => (
              <span key={i} className="block">
                {line}
              </span>
            ))}
          </h2>
          <p className="mt-5 max-w-sm text-sm xl:text-base text-primary-foreground/90 leading-relaxed [text-shadow:0_0_16px_rgba(0,0,0,0.5)]">
            {meta.description}
          </p>
        </div>
      </div>
    </div>
  );
}
