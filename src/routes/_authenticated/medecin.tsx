import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/medecin")({
  head: () => ({ meta: [{ title: "Espace médecin — MediRural" }] }),
  component: () => <Outlet />,
});
