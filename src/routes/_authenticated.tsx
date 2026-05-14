import { createFileRoute, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useAuth, type AppRole } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated")({
  component: AuthLayout,
});

function AuthLayout() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    if (!role) return;
    // Shared routes accessible to any authenticated user
    const sharedPrefixes = ["/call/"];
    if (sharedPrefixes.some((p) => location.pathname.startsWith(p))) return;
    const expected: Record<AppRole, string> = { patient: "/patient", doctor: "/medecin", admin: "/admin" };
    const allowed = expected[role];
    if (!location.pathname.startsWith(allowed)) {
      navigate({ to: allowed });
    }
  }, [user, role, loading, navigate, location.pathname]);

  if (loading || !user || !role) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  return <Outlet />;
}
