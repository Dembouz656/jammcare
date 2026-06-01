import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/patient")({
  head: () => ({ meta: [{ title: "Espace patient — MediRural" }] }),
  component: () => <Outlet />,
});
