import { requireRole } from "@/lib/auth/page";

export default async function SettingsPage() {
  await requireRole("AGENT");
  return <div className="p-[26px_30px]">Settings</div>;
}
