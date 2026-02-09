"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function UnauthorizedPage() {
  const router = useRouter();
  const { signOut, profile } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  const isInactive = profile?.status === "inactive";

  return (
    <div className="min-h-screen flex items-center justify-center bg-whitesmoke p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <ShieldAlert className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {isInactive ? "Account Deactivated" : "Access Denied"}
          </CardTitle>
          <CardDescription>
            {isInactive 
              ? "Your account has been deactivated."
              : "You don't have permission to access this system."
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-sm text-gray-600">
            {isInactive 
              ? "Please contact your administrator to reactivate your account."
              : "This Reports & Analytics system is restricted to administrators only."
            }
          </p>
          <Button onClick={handleSignOut} className="w-full">
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
