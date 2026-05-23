import { AuthLeftPanel } from "@/components/auth/AuthLeftPanel";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-background">
      {/* Left column — animated background + quote/headline (match reference image) */}
      <div className="relative hidden shrink-0 flex-col justify-center overflow-hidden rounded-r-3xl border border-border/70 lg:flex lg:w-[55%]">
        <AuthLeftPanel />
      </div>

      {/* Right column — semantic surface for light/dark/system */}
      <div className="w-full lg:w-[45%] flex flex-col items-center justify-center p-6 sm:p-8 lg:p-12 bg-background">
        <div className="w-full max-w-md px-2">
          {children}
        </div>
      </div>
    </div>
  );
}
