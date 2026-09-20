import AppLayout from "@/components/AppLayout";

export const dynamic = "force-dynamic";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}
