"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { AuthGuard } from "@/components/auth/AuthGuard";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-whitesmoke">
        <Sidebar />
        <div className="pl-64">{children}</div>
      </div>
    </AuthGuard>
  );
}
