import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import {
  listProperties,
  getSelectedProperty,
} from "@/lib/property-context";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const [properties, selected] = await Promise.all([
    listProperties(),
    getSelectedProperty(),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:pl-60">
        <Header
          userName={session.user.name}
          properties={properties}
          selectedPropertyId={selected?.id ?? null}
        />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
