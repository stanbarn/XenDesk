import { AgentDashboard } from "@/components/agent/AgentDashboard";
import { requireRole } from "@/lib/auth/page";

export default async function DashboardPage() {
  const user = await requireRole("AGENT");
  const firstName = (user.name ?? "there").split(" ")[0];
  return <AgentDashboard firstName={firstName} />;
}
