import { AgentTicketsView } from "@/components/agent/AgentTicketsView";
import { CustomerTicketList } from "@/components/customer/CustomerTicketList";
import { requireRole } from "@/lib/auth/page";

export default async function TicketsPage() {
  const user = await requireRole();
  return user.role === "AGENT" ? <AgentTicketsView /> : <CustomerTicketList />;
}
