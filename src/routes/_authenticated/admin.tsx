import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Console admin — MediRural" }] }),
  component: () => <Outlet />,
});
