import { Skeleton } from "@/components/ui/skeleton";

export default function AuthLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="w-48 h-8" />
        <Skeleton className="w-64 h-5" />
      </div>

      {/* Form Fields */}
      <div className="space-y-5">
        <div className="space-y-2">
          <Skeleton className="w-16 h-4" />
          <Skeleton className="w-full h-12 rounded-xl" />
        </div>
        <div className="space-y-2">
          <Skeleton className="w-20 h-4" />
          <Skeleton className="w-full h-12 rounded-xl" />
        </div>
      </div>

      {/* Remember Me & Forgot Password */}
      <div className="flex items-center justify-between">
        <Skeleton className="w-28 h-4" />
        <Skeleton className="w-32 h-4" />
      </div>

      {/* Submit Button */}
      <Skeleton className="w-full h-12 rounded-xl" />

      {/* Divider */}
      <div className="relative py-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <Skeleton className="w-32 h-4 bg-background" />
        </div>
      </div>

      {/* Social Auth Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-11 rounded-lg" />
        <Skeleton className="h-11 rounded-lg" />
      </div>

      {/* Sign Up Link */}
      <div className="flex justify-center">
        <Skeleton className="w-48 h-4" />
      </div>
    </div>
  );
}
