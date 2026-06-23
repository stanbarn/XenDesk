import { SettingsView } from "@/components/agent/SettingsView";
import { requireRole } from "@/lib/auth/page";

export default async function SettingsPage() {
  const user = await requireRole("AGENT");
  return <SettingsView name={user.name ?? ""} email={user.email ?? ""} />;
}
