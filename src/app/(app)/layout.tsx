import { redirect } from "next/navigation";

import { AppShell } from "@/components/shell/AppShell";
import { getSessionUser } from "@/lib/auth/page";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <AppShell
      user={{ name: user.name ?? "", email: user.email ?? "", role: user.role, company: user.company }}
    >
      {children}
    </AppShell>
  );
}
