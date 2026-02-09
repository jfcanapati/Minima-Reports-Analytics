"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (profile && profile.role !== "admin") {
        // Only admin can access this system
        router.push("/unauthorized");
      } else if (profile && profile.status === "inactive") {
        // Inactive users cannot access the system
        router.push("/unauthorized");
      }
    }
  }, [user, profile, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-whitesmoke">
        <Loader2 className="h-8 w-8 animate-spin text-black" />
      </div>
    );
  }

  if (!user || (profile && (profile.role !== "admin" || profile.status === "inactive"))) return null;

  return <>{children}</>;
}
