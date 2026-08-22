import { createFileRoute } from "@tanstack/react-router";
import MainLayout from "@/components/MainLayout";

export const Route = createFileRoute("/_app/settings")({
  component: MainLayout,
});